import React from 'react'
import Icon from '../../../../shared/Icon'
import formatTime from '../../../../../utils/formatTime'
import PlayerTopBar from './PlayerTopBar'
import { IconButton } from './PlayerControls'

// ─── CastPanel ────────────────────────────────────────────────────────────────

// Lo que se ve en el telefono o el PC mientras el video suena en la TV (Google Cast): el video local
// esta pausado y estos controles manejan el reproductor remoto.
const CastPanel = ({ cast, seriesTitle, episodeLabel, image = null, onClose, onPrev, onNext }) => {

  const { remote, device } = cast;
  const buffering = remote.state === 'BUFFERING' || remote.state === 'IDLE';

  // El foco entra aqui: asi las teclas del reproductor (espacio, flechas) no tocan el video local.
  const panel = React.useRef(null);
  React.useEffect(() => { panel.current?.focus({ preventScroll: true }); }, []);

  return (
    <div
      ref={panel}
      tabIndex={-1}
      onKeyDown={(event) => event.stopPropagation()}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center overflow-hidden bg-black text-white outline-none"
    >
      {image && <img src={image} alt="" className="absolute inset-0 size-full scale-110 object-cover opacity-25 blur-2xl" />}
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--accent)_14%,transparent),transparent_65%)]" />

      <PlayerTopBar seriesTitle={seriesTitle} episodeLabel={episodeLabel} onClose={onClose} />

      <div className="relative flex w-full max-w-xl flex-col items-center gap-6 px-6 text-center">
        <span className="cut grid size-16 place-items-center bg-accent text-accent-fg">
          <Icon name="cast" className="size-8" />
        </span>

        <div className="flex flex-col gap-1">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Transmitiendo a</p>
          <p className="font-display-tight text-3xl font-bold">{device ?? 'tu TV'}</p>
        </div>

        {/* Progreso */}
        <div className="flex w-full items-center gap-3">
          <span className="w-16 text-right font-mono text-sm tabular-nums text-white/80">{formatTime(remote.time)}</span>
          <input
            type="range"
            min="0"
            max={Math.max(1, Math.floor(remote.duration || 0))}
            step="1"
            value={Math.min(Math.floor(remote.time || 0), Math.floor(remote.duration || 0))}
            onChange={(event) => cast.seekTo(Number(event.target.value))}
            aria-label="Progreso en la TV"
            disabled={!remote.duration}
            style={{ '--v': `${remote.duration ? (remote.time / remote.duration) * 100 : 0}%` }}
            className="zk-range min-w-0 flex-1"
          />
          <span className="w-16 font-mono text-sm tabular-nums text-white/80">−{formatTime(Math.max(0, (remote.duration || 0) - remote.time))}</span>
        </div>

        {/* Transporte */}
        <div className="flex items-center gap-1 sm:gap-3">
          <IconButton box="size-12" label="Episodio anterior" onClick={onPrev ?? undefined} disabled={!onPrev}>
            <Icon name="previous" className="size-6" />
          </IconButton>
          <IconButton box="size-12" label="Retroceder 10 s" onClick={() => cast.seekBy(-10)}>
            <Icon name="rewind-10" className="size-8" />
          </IconButton>
          <IconButton box="size-20" label={remote.paused ? 'Reproducir' : 'Pausa'} onClick={cast.toggle} disabled={buffering && !remote.paused}>
            <Icon name={remote.paused ? 'play' : 'pause'} className="size-14" />
          </IconButton>
          <IconButton box="size-12" label="Adelantar 10 s" onClick={() => cast.seekBy(10)}>
            <Icon name="forward-10" className="size-8" />
          </IconButton>
          <IconButton box="size-12" label="Siguiente episodio" onClick={onNext ?? undefined} disabled={!onNext}>
            <Icon name="next" className="size-6" />
          </IconButton>
        </div>

        <button
          type="button"
          onClick={cast.stop}
          className="cut-ring relative cursor-pointer bg-white/8 px-6 py-3 font-display text-sm font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-white/16"
        >
          Dejar de transmitir
        </button>

        {cast.error && <p role="alert" className="text-sm font-medium text-red-400">{cast.error}</p>}
      </div>
    </div>
  )
}

export default CastPanel
