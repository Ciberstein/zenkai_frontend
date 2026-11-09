import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon from '../../../../shared/Icon'
import percent from '../../../../../utils/progress.util'
import formatTime from '../../../../../utils/formatTime'

// ─── ResumeRail ───────────────────────────────────────────────────────────────

// Enlaza directo al episodio a medias, no a la ficha: es lo que se espera de
// una fila de "continuar viendo". Formato apaisado porque aqui importa el
// fotograma, no el cartel.
const ResumeRail = ({ items = [] }) => {

  const { t } = useTranslation();

  if (!items.length) return null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-[24px] md:text-[32px]">{t('Continue watching')}</h2>

      <div className="no-scrollbar stagger -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 pt-2 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        {items.map((entry) => {
          const left = Math.max((entry.duration ?? 0) - (entry.progress ?? 0), 0);

          return (
            <Link
              key={entry.id}
              to={`/watch/${entry.anime?.malId}/${entry.episode?.number}`}
              className="group/resume w-72 shrink-0 snap-start sm:w-80"
            >
              <div className="cut relative aspect-video overflow-hidden bg-surface-2">
                <img
                  src={entry.episode?.thumbnail ?? entry.anime?.image}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-700 ease-out-expo group-hover/resume:scale-105"
                />

                <div aria-hidden="true" className="absolute inset-0 cut-ring bg-linear-to-t from-black/80 via-black/10 to-transparent [--ring-color:transparent] [--t:2px] transition-[opacity] duration-300 group-hover/resume:[--ring-color:var(--accent)]" />

                <span
                  aria-hidden="true"
                  className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 scale-90 place-items-center bg-accent text-accent-fg opacity-0 transition-[opacity,transform] duration-300 group-hover/resume:scale-100 group-hover/resume:opacity-100"
                >
                  <Icon name="play" className="ml-0.5 size-5" />
                </span>

                <span className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 text-white">
                  <span className="line-clamp-1 text-sm font-semibold drop-shadow">{entry.anime?.title}</span>
                  <span className="shrink-0 text-[11px] font-medium text-white/80 tnum">
                    {formatTime(left)} restantes
                  </span>
                </span>

                <div className="absolute inset-x-0 bottom-0 h-0.75 bg-white/25">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${percent(entry.progress, entry.duration)}%` }}
                  />
                </div>
              </div>

              <p className="mt-2.5 px-0.5 text-xs text-muted">
                {t('Episode')} {entry.episode?.number}
                {entry.episode?.title && <span> · {entry.episode.title}</span>}
              </p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export default ResumeRail
