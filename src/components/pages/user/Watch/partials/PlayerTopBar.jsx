import React from 'react'
import clsx from 'clsx'
import Icon from '../../../../shared/Icon'

// ─── PlayerTopBar ─────────────────────────────────────────────────────────────

// Cabecera del reproductor: la X para volver a la ficha de la serie, el titulo de
// la serie y debajo el episodio. La comparten los controles del reproductor, que
// la ocultan junto al resto, y los estados sin controles (sin fuente, embed).
const PlayerTopBar = ({ seriesTitle = null, episodeLabel = null, onClose = null, visible = true, children = null }) => (
  <div
    className={clsx(
      'pointer-events-none absolute inset-x-0 top-0 z-20 transition-opacity duration-300',
      visible ? 'opacity-100' : 'opacity-0',
    )}
  >
    <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-black/80 to-transparent" />

    <div className="relative flex items-start gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:gap-4 sm:px-6 sm:pt-5">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Volver a la serie"
          title="Volver a la serie"
          className={clsx(
            'grid size-11 shrink-0 cursor-pointer touch-manipulation place-items-center rounded-full text-white transition-colors hover:bg-white/12 hover:text-accent',
            visible && 'pointer-events-auto',
          )}
        >
          <Icon name="x" className="size-7" />
        </button>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1">
        {seriesTitle && <span className="truncate font-display text-xl font-bold text-white sm:text-3xl">{seriesTitle}</span>}
        {episodeLabel && <span className="truncate font-mono text-xs uppercase tracking-[0.18em] text-accent sm:text-sm">{episodeLabel}</span>}
      </div>

      {children && <div className={clsx('flex shrink-0 items-center gap-1', visible && 'pointer-events-auto')}>{children}</div>}
    </div>
  </div>
)

export default PlayerTopBar
