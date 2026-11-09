import React from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../../material'
import Icon from '../../../../shared/Icon'
import { genreLink, image, STATUS_LABEL, synopsis, title } from '../../../../../utils/anime.util'
import clsx from 'clsx'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SEASONS = { winter: 'Invierno', spring: 'Primavera', summer: 'Verano', fall: 'Otoño' };

const fullDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

// ─── Fact ─────────────────────────────────────────────────────────────────────

// Dato suelto de la ficha. Va en <dl> porque es literalmente una lista de pares
// clave-valor, y asi un lector de pantalla los lee emparejados.
const Fact = ({ label, value }) => {
  if (!value) return null;

  return (
    <div className="flex flex-col gap-1 border-t border-line py-3.5">
      <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  )
};

// ─── AnimeHeader ──────────────────────────────────────────────────────────────

const AnimeHeader = ({ anime, auth, tracked, favorited, firstEpisode, onTrack, onFavorite }) => {

  const [expanded, setExpanded] = React.useState(false);
  const allGenres = useSelector(state => state.genres);
  const { t } = useTranslation();

  const text = synopsis(anime);
  const long = (text?.length ?? 0) > 360;
  const season = anime.season && anime.year ? `${SEASONS[anime.season] ?? anime.season} ${anime.year}` : anime.year;
  const aired = anime.airedFrom
    ? [fullDate(anime.airedFrom), anime.airedTo ? fullDate(anime.airedTo) : 'en emisión'].join(' → ')
    : null;

  return (
    <header className="bleed pull-up relative isolate overflow-hidden">
      {/* La propia portada, desenfocada, pinta el ambiente de la ficha. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <img
          src={anime.banner ?? image(anime)}
          alt=""
          className="size-full scale-[1.4] object-cover opacity-60 blur-[70px] saturate-[1.6]"
        />
        <div className="scrim absolute inset-0" />
        <div className="scrim-x absolute inset-0 opacity-60" />
      </div>

      <div className="gutter grid gap-8 pb-12 pt-[calc(var(--nav-h)+3.5rem)] md:grid-cols-[260px_1fr] md:gap-12 lg:grid-cols-[300px_1fr]">
        <img
          src={image(anime)}
          alt=""
          className="cut-lg w-44 animate-fade-up justify-self-center md:w-full md:justify-self-start"
        />

        <div className="flex min-w-0 animate-fade-up flex-col gap-6" style={{ animationDelay: '80ms' }}>
          <div className="flex flex-col gap-3">
            <p className="eyebrow flex-wrap gap-y-1">
              {[anime.type, season].filter(Boolean).join(' · ')}
              {anime.status === 'Currently Airing' && (
                <span className="inline-flex items-center gap-1.5 text-fg/80">
                  <span className="size-1.5 animate-pulse rounded-full bg-accent" />
                  En emisión
                </span>
              )}
            </p>

            <h1 className="font-display-tight text-[clamp(2.25rem,5vw,4.25rem)] font-bold">
              {title(anime)}
            </h1>

            {anime.titleJapanese && (
              <p lang="ja" className="font-jp text-base font-medium tracking-[0.12em] text-muted">
                {anime.titleJapanese}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {anime.score && (
              <p className="flex items-center gap-2">
                <Icon name="star" className="size-6 text-data" />
                <span className="font-display text-3xl font-bold leading-none tnum">{Number(anime.score).toFixed(1)}</span>
                {anime.scoredBy && (
                  <span className="text-xs leading-tight text-muted tnum">
                    {anime.scoredBy.toLocaleString('es')}<br />votos
                  </span>
                )}
              </p>
            )}

            <ul className="flex flex-wrap gap-2">
              {anime.genres?.map((genre) => (
                <li key={genre.id}>
                  <Link
                    to={genreLink(allGenres, genre)}
                    className="cut-xs relative block px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider text-fg/85 cut-ring [--ring-color:color-mix(in_oklab,var(--fg)_25%,transparent)] transition-colors hover:bg-accent hover:text-accent-fg hover:[--ring-color:var(--accent)]"
                  >
                    {genre.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {firstEpisode ? (
              <Button
                as={Link}
                to={`/watch/${anime.mal_id}/${firstEpisode.number}`}
                size="xl"
                color="light"
                icon={<Icon name="play" className="size-5" />}
              >
                {t('Watch now')}
              </Button>
            ) : (
              <p className="cut-sm cut-ring relative inline-flex items-center gap-2.5 bg-surface-2/80 px-5 py-3 font-mono text-xs uppercase tracking-wider text-muted [--ring-color:var(--line)]">
                <Icon name="info" className="size-4.5" />
                Aún no hay episodios disponibles
              </p>
            )}

            {auth && (
              <>
                <Button
                  size="xl"
                  color="glass"
                  onClick={onTrack}
                  aria-pressed={tracked}
                  icon={<Icon name={tracked ? 'check' : 'plus'} className="size-5" />}
                >
                  {tracked ? 'En tu lista' : t('Add to list')}
                </Button>

                <button
                  type="button"
                  onClick={onFavorite}
                  aria-pressed={favorited}
                  aria-label={favorited ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                  className={clsx(
                    'cut cut-ring cut-focus relative grid size-14 cursor-pointer place-items-center backdrop-blur-md transition-[background-color,transform,color] duration-200 active:scale-90',
                    favorited
                      ? 'bg-accent text-accent-fg [--ring-color:var(--accent)]'
                      : 'bg-fg/10 text-fg [--ring-color:color-mix(in_oklab,var(--fg)_25%,transparent)] hover:bg-fg/20',
                  )}
                >
                  <Icon name="heart" className={clsx('size-5', favorited && 'fill-current')} />
                </button>
              </>
            )}
          </div>

          {text && (
            <div className="flex max-w-2xl flex-col items-start gap-2">
              <p className={clsx('text-[15px] leading-relaxed text-fg/80', !expanded && long && 'line-clamp-4')}>
                {text}
              </p>
              {long && (
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => !prev)}
                  className="cursor-pointer text-sm font-semibold text-accent-text hover:underline"
                >
                  {expanded ? 'Leer menos' : 'Leer más'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="gutter pb-2">
        <dl className="grid grid-cols-2 gap-x-8 sm:grid-cols-3 lg:grid-cols-4">
          <Fact label="Estudio" value={anime.studios?.map((studio) => studio.name).join(', ')} />
          <Fact label={t('Status')} value={STATUS_LABEL[anime.status] ?? anime.status} />
          <Fact label={t('Episodes')} value={anime.episodesCount} />
          <Fact label="Duración" value={anime.duration?.replace('per ep', 'por episodio')} />
          <Fact label="Emisión" value={aired} />
          <Fact label="Origen" value={anime.origin && anime.origin.charAt(0).toUpperCase() + anime.origin.slice(1).replace('_', ' ')} />
          <Fact label="Ranking" value={anime.rank && `#${anime.rank.toLocaleString('es')}`} />
          <Fact label="Miembros" value={anime.members?.toLocaleString('es')} />
        </dl>
      </div>
    </header>
  )
}

export default AnimeHeader
