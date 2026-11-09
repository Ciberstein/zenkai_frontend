import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon from './Icon'
import { episodes, image, malId, score, title, year } from '../../utils/anime.util'
import percent from '../../utils/progress.util'
import clsx from 'clsx'

// ─── AnimeCard ────────────────────────────────────────────────────────────────

// Sirve igual para una fila local que para un resultado remoto: utils/anime.util
// normaliza titulo, imagen e id antes de pintar.
//
// Reposo: portada limpia con dos esquinas cortadas, puntuacion y estado.
// Hover/foco: se enmarca en amarillo, se vela por abajo y asoma la accion
// principal, sin mover nada de sitio (el layout no salta). La portada esta
// recortada, asi que el marco va por dentro (un anillo exterior se cortaria).
const AnimeCard = ({ anime, progress = null, rank = null, lang = 'es', className = '' }) => {

  const { t } = useTranslation();

  const id = malId(anime);
  const rating = score(anime);
  const count = episodes(anime);
  const played = progress ? percent(progress.progress, progress.duration) : 0;
  const airing = anime?.status === 'Currently Airing';
  const name = title(anime, lang);

  return (
    <Link
      to={`/anime/${id}`}
      aria-label={name}
      className={clsx('group/card flex flex-col gap-3 outline-offset-4', className)}
    >
      <div className="cut relative aspect-2/3 overflow-hidden bg-surface-2">
        <img
          src={image(anime)}
          alt=""
          loading="lazy"
          decoding="async"
          draggable="false"
          className="size-full object-cover transition-transform duration-700 ease-out-expo group-hover/card:scale-[1.07]"
        />

        {/* Velo de reposo: sostiene las etiquetas sobre cualquier portada. */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1/4 bg-linear-to-b from-black/60 to-transparent" />

        {rank !== null && (
          <span className="absolute left-3 top-2 font-mono text-[11px] font-bold text-white tnum">
            {String(rank).padStart(2, '0')}
          </span>
        )}

        {rating && (
          <span className="cut-xs absolute right-0 top-0 inline-flex items-center gap-1 bg-black/70 px-2 py-1 font-mono text-[11px] font-bold text-data backdrop-blur-md tnum">
            <Icon name="star" className="size-3" />
            {rating}
          </span>
        )}

        {(airing || anime?.available) && (
          <div className="absolute bottom-2 left-2 flex gap-1 transition-opacity duration-300 group-hover/card:opacity-0">
            {airing && (
              <span className="inline-flex items-center gap-1.5 bg-black/70 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white backdrop-blur-md">
                <span className="size-1.5 animate-pulse rounded-full bg-accent" />
                En emisión
              </span>
            )}
            {anime?.available && (
              <span className="bg-accent px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-accent-fg">HD</span>
            )}
          </div>
        )}

        {/* Capa de hover: velo, marco amarillo y accion. */}
        <div
          aria-hidden="true"
          className={clsx(
            'absolute inset-0 flex flex-col justify-end gap-2 bg-linear-to-t from-black/90 via-black/35 to-transparent p-3',
            'cut-ring opacity-0 transition-opacity duration-300 [--ring-color:var(--accent)] [--t:2px]',
            'group-hover/card:opacity-100 group-focus-visible/card:opacity-100',
          )}
        >
          <div className="flex items-center justify-between">
            <span className="grid size-10 translate-y-2 place-items-center bg-accent text-accent-fg transition-transform duration-500 ease-out-expo group-hover/card:translate-y-0 group-focus-visible/card:translate-y-0">
              <Icon name="play" className="ml-0.5 size-4.5" />
            </span>

            {count && (
              <span className="translate-y-2 font-mono text-[11px] uppercase tracking-wider text-white/85 transition-transform duration-500 ease-out-expo group-hover/card:translate-y-0 tnum">
                {count} {t('eps')}
              </span>
            )}
          </div>
        </div>

        {played > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/25">
            <div className="h-full bg-accent" style={{ width: `${played}%` }} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 px-0.5">
        <h3 className="line-clamp-2 font-sans text-[14px] font-semibold normal-case leading-snug tracking-normal transition-colors group-hover/card:text-accent-text">
          {name}
        </h3>
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
          {[anime?.type, year(anime)].filter(Boolean).join(' · ') || t('Loading')}
        </p>
      </div>
    </Link>
  )
}

export default AnimeCard
