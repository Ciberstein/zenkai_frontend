import React from 'react'
import player_service from '../../../../../services/player.services'
import Icon from '../../../../shared/Icon'

const REPORT_EVERY_MS = 15000;

// Menos de esto no cuenta como haber visto algo: evita crear una entrada de
// historial (y un "continuar viendo" a 0:00) por solo abrir un episodio.
const MIN_WATCHED_SECONDS = 5;

// ─── Player ───────────────────────────────────────────────────────────────────

// Reproductor sobre la fuente elegida. Los enlaces "embed" van en un iframe:
// ahi no hay control de progreso posible, es el precio de apoyarse en un
// reproductor ajeno.
const Player = ({ episode, source, auth, onEnded }) => {

  const video = React.useRef(null);
  const lastReport = React.useRef(0);

  // Devuelve la promesa para poder esperar a que el servidor lo guarde (al
  // terminar, antes de saltar al siguiente). Sin sesion no se reporta nada.
  const report = React.useCallback(() => {
    const node = video.current;
    if (!auth || !node || !node.duration || node.currentTime < MIN_WATCHED_SECONDS) return null;

    return player_service.progress({
      episodeId: episode.id,
      progress: node.currentTime,
      duration: node.duration,
    });
  }, [auth, episode?.id]);

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
    if (!video.current || !saved || saved.completed || saved.progress < MIN_WATCHED_SECONDS) return;

    video.current.currentTime = saved.progress;
  };

  if (!source) {
    return (
      <div className="relative grid aspect-video w-full place-items-center overflow-hidden bg-black px-6 text-center">
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
      <iframe
        src={source.url}
        title={`Episodio ${episode.number}`}
        allowFullScreen
        className="aspect-video w-full bg-black"
      />
    )
  }

  return (
    <video
      ref={video}
      src={source.url}
      controls
      autoPlay
      onLoadedMetadata={onLoadedMetadata}
      onTimeUpdate={onTimeUpdate}
      onPause={report}
      onEnded={async () => { await report(); onEnded?.(); }}
      className="aspect-video w-full bg-black"
    />
  )
}

export default Player
