import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import Icon from '../../../../shared/Icon'
import { Button } from '../../../../material'
import { image } from '../../../../../utils/anime.util'
import percent from '../../../../../utils/progress.util'

// ─── Constantes ───────────────────────────────────────────────────────────────

// Series largas (cientos de episodios): hasta 36 se ven todos; a partir de ahi, por
// tandas, para no cargar cientos de miniaturas de golpe.
const ALL_UP_TO = 36;
const FIRST = 24;
const STEP = 24;

const formatDate = (iso) => {
  const date = iso ? new Date(iso) : null;
  if (!date || Number.isNaN(date.getTime())) return null;

  // La fecha viene a medianoche UTC: sin fijar la zona, en America saldria un dia antes.
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
};

// ─── EpisodeCard ──────────────────────────────────────────────────────────────

// Miniatura 16:9 con el progreso pegado abajo, y debajo el numero y el titulo, la
// descripcion si la hay y los datos. La miniatura del episodio se usa cuando existe;
// si no, la portada de la serie desenfocada con el numero grande, de modo que la lista
// se ve cuidada aunque aun no haya imagenes por episodio.
const EpisodeCard = ({ malId, episode, fallback }) => {

  const { t } = useTranslation();

  const history = episode.history;
  const played = percent(history?.progress, history?.duration);
  const done = Boolean(history?.completed);
  const inProgress = played > 0 && !done;
  const remaining = inProgress ? Math.max(1, Math.ceil((history.duration - history.progress) / 60)) : null;

  const length = episode.duration >= 60 ? Math.round(episode.duration / 60) : null;
  const date = formatDate(episode.aired);
  const name = episode.title ?? `${t('Episode')} ${episode.number}`;

  return (
    <li>
      <Link
        to={`/watch/${malId}/${episode.number}`}
        className="group/ep flex flex-col gap-3 outline-none focus-visible:*:first:ring-2 focus-visible:*:first:ring-accent"
      >
        <div className="relative aspect-video overflow-hidden bg-surface-2">
          {episode.thumbnail ? (
            <img
              src={episode.thumbnail}
              alt=""
              loading="lazy"
              decoding="async"
              className={clsx(
                'size-full object-cover transition-[transform,filter] duration-500 ease-out-expo group-hover/ep:scale-105',
                done && 'brightness-75',
              )}
            />
          ) : (
            <>
              {fallback && (
                <img
                  src={fallback}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  // Cada tarjeta enseña una zona distinta de la portada, para que no sean todas iguales.
                  style={{ objectPosition: `${(episode.number * 37) % 100}% 50%` }}
                  className={clsx(
                    'size-full scale-125 object-cover opacity-45 blur-lg saturate-150 transition-transform duration-500 ease-out-expo group-hover/ep:scale-[1.35]',
                    done && 'brightness-75',
                  )}
                />
              )}

              <span className="absolute inset-0 grid place-items-center font-display text-5xl font-bold text-white/90 [text-shadow:0_2px_12px_rgb(0_0_0/0.6)] tnum sm:text-6xl">
                {episode.number}
              </span>
            </>
          )}

          <span aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-black/20" />

          {/* Al pasar el cursor asoma la accion, sin mover nada de sitio */}
          <span className="absolute inset-0 grid place-items-center bg-black/35 opacity-0 transition-opacity duration-300 group-hover/ep:opacity-100 group-focus-visible/ep:opacity-100">
            <span className="cut grid size-14 place-items-center bg-accent text-accent-fg">
              <Icon name="play" className="ml-0.5 size-6" />
            </span>
          </span>

          {episode.filler && (
            <span className="absolute left-2 top-2 bg-black/75 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-data">
              {t('Filler', 'Relleno')}
            </span>
          )}

          {done && (
            <span className="absolute right-2 top-2 grid size-7 place-items-center bg-black/75 text-accent-text" aria-label="Visto">
              <Icon name="check" className="size-4" />
            </span>
          )}

          {remaining && (
            <span className="absolute bottom-2.5 right-2 bg-black/80 px-2 py-0.5 font-mono text-[11px] tracking-wide text-white tnum">
              Quedan {remaining} min
            </span>
          )}

          {inProgress && (
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 bg-white/25">
              <span className="block h-full bg-accent shadow-[0_0_8px_var(--accent)]" style={{ width: `${played}%` }} />
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <p className={clsx('line-clamp-1 text-[15px] font-semibold transition-colors group-hover/ep:text-accent-text', done && 'text-muted')}>
            <span className="tnum">{episode.number}.</span> {name}
          </p>

          {episode.synopsis && <p className="line-clamp-2 text-sm leading-snug text-muted">{episode.synopsis}</p>}

          {(length || date) && (
            <p className="flex flex-wrap items-center gap-x-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
              {length && <span className="tnum">{length} min</span>}
              {date && <span>{date}</span>}
            </p>
          )}
        </div>
      </Link>
    </li>
  )
}

// ─── EpisodeList ──────────────────────────────────────────────────────────────

const EpisodeList = ({ malId, anime = null, episodes = [] }) => {

  const { t } = useTranslation();
  const [extra, setExtra] = React.useState(0);

  if (!episodes.length) return null;

  const limit = episodes.length <= ALL_UP_TO ? episodes.length : FIRST + extra;
  const fallback = anime ? (anime.banner ?? image(anime)) : null;

  return (
    <section className="flex flex-col gap-6">
      <h2 className="flex items-baseline gap-3 text-[24px] md:text-[32px]">
        {t('Episodes')}
        <span className="text-sm font-medium text-muted tnum">{episodes.length}</span>
      </h2>

      <ol className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {episodes.slice(0, limit).map((episode) => (
          <EpisodeCard key={episode.id} malId={malId} episode={episode} fallback={fallback} />
        ))}
      </ol>

      {episodes.length > limit && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button color="glass" size="sm" onClick={() => setExtra((current) => current + STEP)}>
            Mostrar {Math.min(STEP, episodes.length - limit)} más
          </Button>

          <Button color="ghost" size="sm" onClick={() => setExtra(episodes.length)}>
            Mostrar todos · {episodes.length - limit} restantes
          </Button>
        </div>
      )}
    </section>
  )
}

export default EpisodeList
