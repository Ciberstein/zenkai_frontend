import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon from '../../../../shared/Icon'
import percent from '../../../../../utils/progress.util'
import clsx from 'clsx'

// ─── EpisodeList ──────────────────────────────────────────────────────────────

// Filas a todo el ancho, como en las plataformas grandes: el numero manda, el
// titulo y la fecha acompanan y el progreso se ve sin abrir nada.
const EpisodeList = ({ malId, episodes = [] }) => {

  const { t } = useTranslation();

  if (!episodes.length) return null;

  return (
    <section className="flex flex-col gap-5">
      <h2 className="flex items-baseline gap-3 text-[24px] md:text-[32px]">
        {t('Episodes')}
        <span className="text-sm font-medium text-muted tnum">{episodes.length}</span>
      </h2>

      <ol className="hud flex flex-col border border-line bg-surface/50">
        {episodes.map((episode) => {
          const played = percent(episode.history?.progress, episode.history?.duration);
          const done = episode.history?.completed;
          const date = episode.aired
            ? new Date(episode.aired).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
            : null;

          return (
            <li key={episode.id} className="border-b border-line last:border-b-0">
              <Link
                to={`/watch/${malId}/${episode.number}`}
                className="group/ep flex items-center gap-4 px-4 py-4 transition-colors duration-200 hover:bg-surface-2/70 sm:gap-6 sm:px-6"
              >
                <span className="w-10 shrink-0 text-center font-display text-2xl font-bold text-muted transition-colors group-hover/ep:text-accent-text tnum sm:w-12 sm:text-3xl">
                  {episode.number}
                </span>

                <span className="min-w-0 flex-1">
                  <span className={clsx(
                    'line-clamp-1 block text-[15px] font-semibold',
                    done && 'text-muted',
                  )}>
                    {episode.title ?? `${t('Episode')} ${episode.number}`}
                  </span>

                  <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted">
                    {date && <span>{date}</span>}
                    {episode.duration && <span className="tnum">{Math.round(episode.duration / 60)} min</span>}
                    {episode.filler && <span className="font-semibold text-data">Relleno</span>}
                  </span>

                  {played > 0 && !done && (
                    <span className="mt-2 block h-0.75 w-full max-w-48 overflow-hidden bg-surface-2">
                      <span className="block h-full bg-accent" style={{ width: `${played}%` }} />
                    </span>
                  )}
                </span>

                {done
                  ? <Icon name="check" className="size-5 shrink-0 text-accent-text" />
                  : (
                    <span className="grid size-10 shrink-0 place-items-center bg-surface-2 text-fg opacity-70 transition-[opacity,background-color,color,transform] duration-300 group-hover/ep:scale-110 group-hover/ep:bg-accent group-hover/ep:text-accent-fg group-hover/ep:opacity-100">
                      <Icon name="play" className="ml-0.5 size-4" />
                    </span>
                  )}
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export default EpisodeList
