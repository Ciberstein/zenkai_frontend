import React from 'react'
import Hls from 'hls.js'
import { useSelector } from 'react-redux'
import player_service from '../../../../../services/player.services'
import { audioLabel, matchLanguage, readPrefs, savePref, sourceLabel, subtitleName } from '../../../../../utils/player.util'
import Icon from '../../../../shared/Icon'
import PlayerControls, { IconButton, Section } from './PlayerControls'
import PlayerTopBar from './PlayerTopBar'
import PartyPanel from './PartyPanel'
import usePartySync from './usePartySync'
import useCast from './useCast'
import CastPanel from './CastPanel'

const REPORT_EVERY_MS = 15000;

// Menos de esto no cuenta como haber visto algo: evita crear una entrada de
// historial (y un "continuar viendo" a 0:00) por solo abrir un episodio.
const MIN_WATCHED_SECONDS = 5;

// ─── EmbedBar ─────────────────────────────────────────────────────────────────

// Un iframe (YouTube, por ejemplo) trae sus propios controles y no se puede mandar
// sobre el: esta barra fina le da lo que el reproductor propio tiene siempre, volver
// a la serie, cambiar de episodio y de servidor.
const EmbedBar = ({ seriesTitle, episodeLabel, onClose, onPrev, onNext, sources, source, onSource }) => {

  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative h-18 shrink-0 sm:h-24">
      <PlayerTopBar seriesTitle={seriesTitle} episodeLabel={episodeLabel} onClose={onClose}>
        <IconButton label="Episodio anterior" onClick={onPrev ?? undefined} disabled={!onPrev}>
          <Icon name="previous" className="size-5" />
        </IconButton>

        <IconButton label="Siguiente episodio" onClick={onNext ?? undefined} disabled={!onNext}>
          <Icon name="next" className="size-5" />
        </IconButton>

        {sources.length > 1 && (
          <IconButton label="Servidor" active={open} aria-expanded={open} onClick={() => setOpen((current) => !current)}>
            <Icon name="settings" className="size-6" />
          </IconButton>
        )}
      </PlayerTopBar>

      {open && (
        <div className="absolute right-3 top-full z-30 mt-1 max-h-[60vh] w-64 overflow-y-auto bg-black/92 text-white backdrop-blur-md sm:right-6">
          <Section
            title="Servidor"
            items={sources.map((item) => ({ key: String(item.id), label: sourceLabel(item) }))}
            value={String(source?.id)}
            onSelect={(key) => { setOpen(false); onSource(sources.find((item) => String(item.id) === key)); }}
          />
        </div>
      )}
    </div>
  )
}

// ─── PartyToast ───────────────────────────────────────────────────────────────

// Aviso breve de lo que acaba de hacer otro miembro de la sala ("Ana pausó").
const PartyToast = ({ activity }) => {

  const [text, setText] = React.useState(null);
  const first = React.useRef(activity?.id);   // el aviso que ya estaba al montar no se repite

  React.useEffect(() => {
    if (!activity || activity.id === first.current) return;

    setText(activity.text);
    const timer = setTimeout(() => setText(null), 2500);

    return () => clearTimeout(timer);
  }, [activity]);

  if (!text) return null;

  return (
    <div role="status" className="pointer-events-none absolute left-1/2 top-24 z-30 -translate-x-1/2 bg-black/80 px-3 py-1.5 text-sm text-white">
      {text}
    </div>
  )
}

// ─── Player ───────────────────────────────────────────────────────────────────

// Reproductor sobre la fuente elegida:
//   · hls   → hls.js (o el nativo de Safari). Un solo manifiesto trae todas las
//             calidades y pistas de audio; aqui se elige cual sonar.
//   · mp4   → <video> directo.
//   · embed → iframe: ahi no hay control de progreso posible, es el precio de
//             apoyarse en un reproductor ajeno.
// Los subtitulos son archivos WebVTT aparte (episode.subtitles); el texto lo
// dibuja PlayerControls. Esta pieza lleva el video, las pistas y el progreso; la
// interfaz (controles, barra, atajos) vive en PlayerControls.
const Player = ({
  episode, source, auth, onEnded,
  seriesTitle = null, episodeLabel = null, onClose = null,
  onPrev = null, onNext = null,
  sources = [], onSource = () => {},
  party = null, onStartParty = null, onLeaveParty = null, partyLink = null,
}) => {

  const wrapper = React.useRef(null);
  const video = React.useRef(null);
  const hls = React.useRef(null);
  const lastReport = React.useRef(0);

  const [failed, setFailed] = React.useState(false);
  // Los subtitulos piden el video en modo CORS; si el servidor del mp4 no lo
  // permite, el video no carga. En ese caso se reintenta sin CORS (sin subtitulos).
  const [cors, setCors] = React.useState(true);

  const [audio, setAudio] = React.useState({ tracks: [], current: null });
  const [levels, setLevels] = React.useState({ list: [], current: -1 });
  const [hlsCaptions, setHlsCaptions] = React.useState([]);
  const [caption, setCaption] = React.useState('off');

  // Idioma del perfil del usuario: manda al elegir audio y subtítulos. En una ref para que
  // cambiarlo no reinicie el reproductor a mitad de episodio.
  const profileLanguage = useSelector((state) => state.account?.profile?.language) ?? null;
  const profileRef = React.useRef(profileLanguage);
  profileRef.current = profileLanguage;

  const subtitles = React.useMemo(() => episode?.subtitles ?? [], [episode]);
  const isHls = source?.type === 'hls';

  // Ver juntos: el panel de la sala (abierto al entrar por un enlace) y la sincronizacion del video.
  const [panel, setPanel] = React.useState(Boolean(party?.active));
  const mediaKey = source ? `${source.url}-${cors}` : null;
  const sync = usePartySync(party, video, mediaKey);

  // Transmitir a la TV (AirPlay o Google Cast).
  const cast = useCast({
    video, mediaKey, source, isHls, subtitles, caption, cors,
    title: seriesTitle, subtitle: episodeLabel, image: episode?.thumbnail ?? null,
  });

  const toggleParty = async () => {
    if (party.active) return setPanel((open) => !open);

    const res = await onStartParty?.();
    if (res?.ok) setPanel(true);
  };

  // Devuelve la promesa para poder esperar a que el servidor lo guarde (al
  // terminar, antes de saltar al siguiente). Sin sesion no se reporta nada.
  const report = React.useCallback(() => {
    const node = video.current;
    // Mientras suena en la TV (Google Cast) el video local esta quieto: manda la posicion remota.
    const time = cast.timeRef.current ?? node?.currentTime;
    if (!auth || !node || !node.duration || time < MIN_WATCHED_SECONDS) return null;

    return player_service.progress({
      episodeId: episode.id,
      progress: time,
      duration: node.duration,
    });
  }, [auth, episode?.id, cast.timeRef]);

  // Sin timeupdate local, la posicion remota se reporta por reloj.
  React.useEffect(() => {
    if (!cast.remoteControl) return;

    const timer = setInterval(report, REPORT_EVERY_MS);
    return () => clearInterval(timer);
  }, [cast.remoteControl, report]);

  // Se reporta cada 15s de reproduccion, al pausar y al desmontar, para no
  // castigar al backend con un POST por segundo.
  const onTimeUpdate = () => {
    const now = Date.now();
    if (now - lastReport.current < REPORT_EVERY_MS) return;
    lastReport.current = now;
    report();
  };

  React.useEffect(() => () => report(), [report]);

  // Retoma donde se dejo, salvo que ya se haya visto entero: reabrir un
  // episodio terminado debe empezar desde el principio, no en los creditos.
  const onLoadedMetadata = () => {
    const saved = episode?.history;

    // En una sala manda la posicion compartida, no donde se quedo este usuario.
    if (party?.active) return;

    if (!video.current || !saved || saved.completed || saved.progress < MIN_WATCHED_SECONDS) return;

    video.current.currentTime = saved.progress;
  };

  // ── HLS ────────────────────────────────────────────────────────────────────

  React.useEffect(() => {
    const node = video.current;

    setFailed(false);
    setCors(true);
    setAudio({ tracks: [], current: null });
    setLevels({ list: [], current: -1 });
    setHlsCaptions([]);

    if (!node || !isHls) return;

    // Safari reproduce HLS sin ayuda (y no soporta MSE para hls.js en iOS).
    if (!Hls.isSupported()) {
      if (node.canPlayType('application/vnd.apple.mpegurl')) node.src = source.url;
      else setFailed(true);
      return;
    }

    // Los subtitulos del propio manifiesto no se muestran solos: hls.js activa
    // el que el manifiesto marca por defecto y saldrian dos a la vez junto a los
    // .vtt. Solo se ven cuando el usuario los elige en el menu.
    const instance = new Hls({ enableWorker: true, subtitleDisplay: false, enableCEA708Captions: false });
    hls.current = instance;

    const syncAudio = () => setAudio({
      tracks: instance.audioTracks.map((track, index) => ({ key: String(index), label: audioLabel(track, `Pista ${index + 1}`), lang: track.lang })),
      current: String(instance.audioTrack),
    });

    instance.on(Hls.Events.MANIFEST_PARSED, () => {
      // Una entrada por altura: un manifiesto puede traer varias variantes de la
      // misma resolucion (codecs o tasas distintas) y "1080p" repetido no le dice
      // nada al usuario. Se queda con la de mayor tasa, de mayor a menor.
      const byHeight = new Map();
      instance.levels.forEach((level, index) => {
        const best = byHeight.get(level.height);
        if (!best || level.bitrate > instance.levels[best].bitrate) byHeight.set(level.height, index);
      });

      setLevels({
        list: [...byHeight.entries()]
          .filter(([height]) => height > 0)
          .sort((a, b) => b[0] - a[0])
          .map(([height, index]) => ({ key: String(index), label: `${height}p` })),
        current: -1,
      });
      syncAudio();
    });

    // Audio inicial, por orden: lo que el usuario eligio a mano la ultima vez, el idioma de su
    // perfil y, si el episodio no trae ninguno de los dos, la pista que el manifiesto marca por
    // defecto. Se decide aqui y no en MANIFEST_PARSED: hasta que se carga el nivel, hls.js todavia
    // no expone las pistas (audioTracks esta vacio). Solo la primera vez: despues manda el usuario.
    let audioChosen = false;

    instance.on(Hls.Events.AUDIO_TRACKS_UPDATED, () => {
      if (!audioChosen && instance.audioTracks.length) {
        audioChosen = true;

        for (const wanted of [readPrefs().audio, profileRef.current]) {
          const match = matchLanguage(instance.audioTracks, wanted);

          if (match >= 0) { if (match !== instance.audioTrack) instance.audioTrack = match; break; }
        }
      }

      syncAudio();
    });
    instance.on(Hls.Events.AUDIO_TRACK_SWITCHED, syncAudio);

    instance.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, () => {
      setHlsCaptions(instance.subtitleTracks.map((track, index) => ({
        key: `hls:${index}`, label: (track.lang && subtitleName(track.lang, track.name)) || track.name || `Subtítulos ${index + 1}`, lang: track.lang,
      })));
    });

    instance.on(Hls.Events.ERROR, (_, data) => {
      if (!data.fatal) return;

      if (data.type === Hls.ErrorTypes.NETWORK_ERROR) instance.startLoad();
      else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) instance.recoverMediaError();
      else { instance.destroy(); setFailed(true); }
    });

    instance.attachMedia(node);
    instance.loadSource(source.url);

    return () => { instance.destroy(); hls.current = null; };
  }, [source?.url, isHls]);

  // ── Subtitulos ─────────────────────────────────────────────────────────────

  // Al cambiar de episodio: ninguno si el usuario los habia apagado; si no, el idioma que eligio
  // la ultima vez, el de su perfil y, a falta de ambos, la pista marcada por defecto (o ninguna).
  React.useEffect(() => {
    const chosen = readPrefs().captions;

    if (chosen === 'off') return setCaption('off');

    let match = null;

    for (const wanted of [chosen, profileRef.current]) {
      const index = matchLanguage(subtitles, wanted, (track) => track.language);

      if (index >= 0) { match = subtitles[index]; break; }
    }

    match ??= subtitles.find((track) => track.default);
    setCaption(match ? `db:${match.id}` : 'off');
  }, [episode?.id, subtitles]);

  React.useEffect(() => {
    const node = video.current;
    if (!node) return;

    // `hidden` carga la pista y dispara sus eventos pero no la dibuja el navegador:
    // el texto lo pinta PlayerControls, para poder subirlo cuando aparece la barra.
    for (const track of node.textTracks) {
      if (!track.id.startsWith('zk-')) continue;
      track.mode = caption === `db:${track.id.slice(3)}` ? 'hidden' : 'disabled';
    }

    if (hls.current) {
      const own = caption.startsWith('hls:');
      hls.current.subtitleDisplay = own;
      if (own) hls.current.subtitleTrack = Number(caption.slice(4));
    }
  }, [caption, hlsCaptions.length, source?.url, episode?.id, cors]);

  // Sin CORS (reintento de un mp4 ajeno) los .vtt no se cargan: no se ofrecen en el menu.
  const captions = [
    { key: 'off', label: 'Desactivados' },
    ...(cors ? subtitles.map((track) => ({ key: `db:${track.id}`, label: track.label, lang: track.language })) : []),
    ...hlsCaptions,
  ];

  const chooseCaption = (key) => {
    setCaption(key);
    savePref('captions', key === 'off' ? 'off' : captions.find((item) => item.key === key)?.lang ?? null);
  };

  const chooseAudio = (key) => {
    if (hls.current) hls.current.audioTrack = Number(key);
    savePref('audio', audio.tracks.find((track) => track.key === key)?.lang ?? null);
  };

  const chooseLevel = (key) => {
    if (!hls.current) return;
    hls.current.currentLevel = Number(key);
    setLevels((prev) => ({ ...prev, current: Number(key) }));
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!source) {
    return (
      <div className="zk-screen grid size-full place-items-center overflow-hidden bg-black px-6 text-center">
        <PlayerTopBar seriesTitle={seriesTitle} episodeLabel={episodeLabel} onClose={onClose} />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--accent)_16%,transparent),transparent_65%)]"
        />
        <div className="relative flex max-w-sm flex-col items-center gap-3">
          <span className="grid size-14 place-items-center bg-white/8 text-white/70 ring-1 ring-white/15">
            <Icon name="info" className="size-6" />
          </span>
          <p className="font-display text-xl font-bold text-white">Este episodio aún no está disponible</p>
          <p className="text-sm text-white/60">
            Todavía no hay una fuente de video para este capítulo. Vuelve más tarde o prueba con otro episodio.
          </p>
        </div>
      </div>
    )
  }

  if (source.type === 'embed') {
    return (
      <div className="zk-screen flex size-full flex-col bg-black">
        <EmbedBar
          seriesTitle={seriesTitle}
          episodeLabel={episodeLabel}
          onClose={onClose}
          onPrev={onPrev}
          onNext={onNext}
          sources={sources}
          source={source}
          onSource={onSource}
        />

        <iframe
          src={source.url}
          title={episodeLabel ?? `Episodio ${episode.number}`}
          allowFullScreen
          className="min-h-0 w-full flex-1 bg-black"
        />
      </div>
    )
  }

  return (
    <div ref={wrapper} tabIndex={0} className="zk-player relative size-full bg-black outline-none">
      <video
        key={mediaKey}
        ref={video}
        // Los subtitulos suelen vivir en otro dominio: el navegador solo los carga
        // si el video se pide en modo CORS (y el servidor lo permite).
        crossOrigin={subtitles.length && cors ? 'anonymous' : undefined}
        onError={() => { if (!isHls && subtitles.length && cors) setCors(false); }}
        src={isHls ? undefined : source.url}
        autoPlay={!party?.active && !cast.casting}
        playsInline
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onPause={report}
        onEnded={async () => { await report(); onEnded?.(); }}
        className="size-full bg-black object-contain"
      >
        {subtitles.map((track) => (
          <track
            key={track.id}
            id={`zk-${track.id}`}
            kind="subtitles"
            src={track.url}
            srcLang={track.language}
            label={track.label}
          />
        ))}
      </video>

      {failed ? (
        <div className="absolute inset-0 z-20 grid place-items-center bg-black/80 px-6 text-center">
          <div className="absolute inset-x-0 top-0">
            <EmbedBar
              seriesTitle={seriesTitle}
              episodeLabel={episodeLabel}
              onClose={onClose}
              onPrev={onPrev}
              onNext={onNext}
              sources={sources}
              source={source}
              onSource={onSource}
            />
          </div>

          <p className="max-w-sm text-sm text-white/80">
            No se pudo reproducir esta fuente. Prueba con otro servidor.
          </p>
        </div>
      ) : (
        <PlayerControls
          video={video}
          wrapper={wrapper}
          mediaKey={mediaKey}
          seriesTitle={seriesTitle}
          episodeLabel={episodeLabel}
          onClose={onClose}
          audio={audio}
          levels={levels}
          captions={captions}
          caption={caption}
          onAudio={chooseAudio}
          onLevel={chooseLevel}
          onCaption={chooseCaption}
          onPrev={onPrev}
          onNext={onNext}
          segments={episode.segments ?? []}
          sources={sources}
          source={source}
          onSource={onSource}
          topActions={((party && onStartParty) || cast.available) && (
            <>
              {cast.available && (
                <IconButton
                  label={cast.casting ? 'Transmitiendo a la TV' : 'Transmitir a la TV'}
                  active={cast.casting}
                  onClick={cast.request}
                >
                  <Icon name="cast" className="size-6" />
                </IconButton>
              )}

              {party && onStartParty && (
                <IconButton
                  label={party.active ? 'Sala para ver juntos' : 'Ver juntos'}
                  active={party.active && panel}
                  aria-expanded={party.active ? panel : undefined}
                  onClick={toggleParty}
                >
                  <Icon name="users" className="size-6" />
                </IconButton>
              )}
            </>
          )}
        />
      )}

      {cast.remoteControl && !failed && (
        <CastPanel
          cast={cast}
          seriesTitle={seriesTitle}
          episodeLabel={episodeLabel}
          image={episode?.thumbnail ?? null}
          onClose={onClose}
          onPrev={onPrev}
          onNext={onNext}
        />
      )}

      {party?.active && panel && !failed && (
        <PartyPanel party={party} link={partyLink} onClose={() => setPanel(false)} onLeave={onLeaveParty} />
      )}

      {party?.active && <PartyToast activity={party.activity} />}

      {sync.blocked && (
        <button
          type="button"
          onClick={sync.resume}
          className="absolute inset-0 z-40 grid cursor-pointer place-items-center bg-black/70 px-6 text-center text-white"
        >
          <span className="flex flex-col items-center gap-3">
            <span className="grid size-16 place-items-center bg-accent text-accent-fg"><Icon name="play" className="ml-0.5 size-7" /></span>
            <span className="font-display text-xl font-bold">Toca para unirte a la reproducción</span>
            <span className="text-sm text-white/65">Tu navegador necesita un toque para empezar con sonido.</span>
          </span>
        </button>
      )}

      {party?.status === 'error' && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-black/80 px-6 text-center text-white">
          <div className="flex max-w-sm flex-col items-center gap-4">
            <p className="font-display text-xl font-bold">{party.error}</p>
            <button type="button" onClick={onLeaveParty} className="cursor-pointer bg-accent px-4 py-2 text-sm font-semibold text-accent-fg">Ver sin sala</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Player
