import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { Context } from '../../../../../context'
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

// Miniatura 16:9 con el progreso pegado abajo; el numero, el titulo y los datos van
// dentro del recuadro, sobre un degradado al pie. La miniatura del episodio se usa cuando existe;
// si no, la portada de la serie desenfocada con el numero grande, de modo que la lista
// se ve cuidada aunque aun no haya imagenes por episodio.
const EpisodeCard = ({ malId, episode, fallback }) => {

  const { t } = useTranslation();
  const { auth } = React.useContext(Context.Auth);

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
        className="group/ep relative block aspect-video overflow-hidden bg-surface-2 outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <div className="absolute inset-0">
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

          <span aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-black/20" />

          {/* Al pasar el cursor asoma la accion, sin mover nada de sitio */}
          <span className="absolute inset-0 grid place-items-center bg-black/35 opacity-0 transition-opacity duration-300 group-hover/ep:opacity-100 group-focus-visible/ep:opacity-100">
            <span className="cut grid size-14 place-items-center bg-accent text-accent-fg" title={auth ? undefined : 'Inicia sesión para ver'}>
              <Icon name={auth ? 'play' : 'lock'} className={auth ? 'ml-0.5 size-6' : 'size-6'} />
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

          {inProgress && (
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 bg-white/25">
              <span className="block h-full bg-accent shadow-[0_0_8px_var(--accent)]" style={{ width: `${played}%` }} />
            </span>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 px-3 pb-3 pt-8">
          <p className={clsx('line-clamp-1 text-[15px] font-semibold text-white transition-colors group-hover/ep:text-accent-text [text-shadow:0_1px_6px_rgb(0_0_0/0.7)]', done && 'text-white/60')}>
            <span className="tnum">{episode.number}.</span> {name}
          </p>

          {(length || date || remaining) && (
            <p className="flex flex-wrap items-center gap-x-3 font-mono text-[11px] uppercase tracking-[0.12em] text-white/70">
              {length && <span className="tnum">{length} min</span>}
              {date && <span>{date}</span>}
              {remaining && <span className="tnum text-accent-text">Quedan {remaining} min</span>}
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
