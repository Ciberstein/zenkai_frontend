import React from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Context } from '../../../../context'
import { image } from '../../../../utils/anime.util'
import { animeThunk } from '../../../../store/slices/anime.slice'
import { episodesThunk, episodeThunk } from '../../../../store/slices/episodes.slice'
import LoginGate from './partials/LoginGate'
import Player from './partials/Player'
import PlayerTopBar from './partials/PlayerTopBar'
import useWatchParty from './partials/useWatchParty'

// Un marco que tapa toda la pantalla, por encima incluso de las lineas CRT del tema
// oscuro (z 9998): aqui manda el video. Sin barra superior ni lista de episodios;
// volver a la serie, cambiar de episodio y de servidor viven dentro del reproductor.
// Es también el elemento que se pone a pantalla completa (data-player-stage): no se desmonta al
// cambiar de episodio, así que la pantalla completa se mantiene aunque el reproductor se recargue.
const Stage = ({ children }) => (
  <div data-player-stage className="fixed inset-0 z-9999 overflow-hidden bg-black">{children}</div>
)

export const WatchPage = () => {

  const { malId, number } = useParams();
  const { auth } = React.useContext(Context.Auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const anime = useSelector(state => state.anime);
  const episodes = useSelector(state => state.episodes);
  const config = useSelector(state => state.config);

  const [episode, setEpisode] = React.useState(null);
  const [source, setSource] = React.useState(null);

  // Ver juntos: ?party=CODIGO mete esta pagina en una sala. El codigo se conserva al cambiar de episodio.
  const [search, setSearch] = useSearchParams();
  const code = auth ? search.get('party') : null;
  const suffix = code ? `?party=${code}` : '';

  const party = useWatchParty({
    code,
    malId,
    number,
    // El anfitrion cambio de episodio (o el enlace era de uno anterior): se le sigue.
    onEpisode: (data) => navigate(`/watch/${data.malId}/${data.number}${suffix}`, { replace: true }),
  });

  React.useEffect(() => {
    if (anime?.mal_id !== Number(malId)) dispatch(animeThunk(malId));
    dispatch(episodesThunk(malId));
  }, [malId]);

  React.useEffect(() => {
    setEpisode(null);

    dispatch(episodeThunk(malId, number)).then((data) => {
      setEpisode(data);
      // Preferencia por defecto: la primera fuente subtitulada, que suele estar
      // disponible antes que el doblaje.
      setSource(data?.sources?.find((item) => item.language === 'sub') ?? data?.sources?.[0] ?? null);
    });
  }, [malId, number]);

  const index = episodes.findIndex((item) => item.number === Number(number));
  const previous = index > 0 ? episodes[index - 1] : null;
  const next = index >= 0 && index < episodes.length - 1 ? episodes[index + 1] : null;

  // En una sala solo el anfitrion cambia de episodio (los demas lo siguen).
  const inRoom = party.active && party.status !== 'error';
  const canChange = !inRoom || party.isHost;

  const go = (item) => {
    if (inRoom) party.changeEpisode(Number(malId), item.number);
    navigate(`/watch/${malId}/${item.number}${suffix}`);
  };

  const goTo = (item) => (canChange ? () => go(item) : null);
  const close = () => navigate(`/anime/${malId}`);

  // El titulo de la serie solo cuando ya es la de esta pagina: el store puede tener
  // todavia la anterior mientras carga.
  const seriesTitle = anime?.mal_id === Number(malId) ? (anime?.titleEnglish ?? anime?.title) : null;

  // El reproductor ya guardo el final antes de llamar aqui: se recarga la lista
  // para que el episodio salga como visto, haya o no siguiente.
  const onEnded = async () => {
    if (auth) await dispatch(episodesThunk(malId));
    if (config?.['player_auto_next'] && next && canChange) go(next);
  };

  const startParty = async () => {
    const res = await party.create();
    if (res?.ok) setSearch({ party: res.room.code }, { replace: true });
    return res;
  };

  const leaveParty = () => setSearch({}, { replace: true });

  // La web es pública pero el reproductor no: sin sesión (o si el servidor marca el episodio como
  // bloqueado) se invita a entrar, con la miniatura del episodio de fondo.
  if (!auth || episode?.locked) {
    const cover = anime?.mal_id === Number(malId) ? (anime.banner ?? image(anime)) : null;
    const thumb = episode?.thumbnail ?? episodes.find((item) => item.number === Number(number))?.thumbnail ?? cover;

    return (
      <Stage>
        <LoginGate
          seriesTitle={seriesTitle}
          episodeLabel={`${t('Episode')} ${number}`}
          background={thumb}
          onClose={close}
        />
      </Stage>
    )
  }

  if (!episode) {
    return (
      <Stage>
        <PlayerTopBar seriesTitle={seriesTitle} onClose={close} />

        <div className="absolute inset-0 grid place-items-center">
          <span className="size-12 animate-spin rounded-full border-2 border-white/20 border-t-accent" role="status" aria-label="Cargando" />
        </div>
      </Stage>
    )
  }

  const episodeLabel = `${t('Episode')} ${episode.number}${episode.title ? ` · ${episode.title}` : ''}`;

  return (
    <Stage>
      <Player
        episode={episode}
        source={source}
        auth={auth}
        onEnded={onEnded}
        seriesTitle={seriesTitle}
        episodeLabel={episodeLabel}
        onClose={close}
        onPrev={previous ? goTo(previous) : null}
        onNext={next ? goTo(next) : null}
        sources={episode.sources ?? []}
        onSource={setSource}
        party={party}
        onStartParty={startParty}
        onLeaveParty={leaveParty}
        partyLink={`${window.location.origin}/watch/${malId}/${number}${suffix}`}
      />
    </Stage>
  )
}
