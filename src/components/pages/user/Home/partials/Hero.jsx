import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../../material'
import Icon from '../../../../shared/Icon'
import anime_service from '../../../../../services/anime.services'
import library_service from '../../../../../services/library.services'
import { episodes, genreLink, image, malId, score, STATUS_LABEL, synopsis, title, year } from '../../../../../utils/anime.util'
import clsx from 'clsx'

// ─── Constants ────────────────────────────────────────────────────────────────

const SLIDES = 5;
const SLIDE_MS = 9000;

const useReducedMotion = () => {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const onChange = (event) => setReduced(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
};

// ─── Hero ─────────────────────────────────────────────────────────────────────

// Portada de inicio. MyAnimeList solo entrega posters verticales (sin banner),
// asi que en vez de estirar una imagen pequena a todo el ancho, el propio
// poster se difumina como atmosfera, sobre una cuadricula de plano tecnico, y
// se muestra nitido a un lado dentro de un marco de HUD.
//
// Rota sola; cada segmento inferior es a la vez el indicador, la cuenta atras
// y el control. Se detiene al pasar el cursor o enfocar, y no rota si el
// usuario pidio menos movimiento.
const Hero = ({ items = [], auth = false }) => {

  const slides = React.useMemo(() => items.slice(0, SLIDES), [items]);

  const [active, setActive] = React.useState(0);
  const [details, setDetails] = React.useState({});
  const [listed, setListed] = React.useState({});
  const allGenres = useSelector(state => state.genres);
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const { t } = useTranslation();

  // Todas las fichas por adelantado: el cambio de slide nunca espera a la red.
  React.useEffect(() => {
    let alive = true;

    slides.forEach((item) => {
      anime_service.detail(malId(item)).then((data) => {
        if (alive && data) setDetails((prev) => ({ ...prev, [malId(item)]: data }));
      });
    });

    return () => { alive = false; };
  }, [slides]);

  const next = React.useCallback(
    () => setActive((prev) => (prev + 1) % Math.max(slides.length, 1)),
    [slides.length],
  );

  if (!slides.length) return null;

  const current = slides[Math.min(active, slides.length - 1)];
  const id = malId(current);
  const full = details[id] ?? current;
  const text = synopsis(full);
  const rating = score(current);
  const count = episodes(current);
  const studio = full.studios?.[0]?.name;
  const genres = full.genres?.slice(0, 3) ?? [];
  const status = STATUS_LABEL[current.status];

  const onList = async () => {
    if (!auth) return navigate('/login');

    listed[id]
      ? await library_service.untrack(id)
      : await library_service.track(id, 'planned');
    setListed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Destacados"
      className="group/hero bleed pull-up relative isolate overflow-hidden"
    >
      {/* Atmosfera: el poster de cada slide, desenfocado, con fundido cruzado. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-bg">
        {slides.map((item, index) => (
          <img
            key={malId(item)}
            src={image(item)}
            alt=""
            className={clsx(
              'absolute inset-0 size-full scale-[1.35] object-cover blur-[70px] saturate-[1.5]',
              'transition-opacity duration-1000 ease-out',
              index === active ? 'opacity-60' : 'opacity-0',
            )}
          />
        ))}
        <div className="grid-hud absolute inset-0" />
        <div className="scrim absolute inset-0" />
        <div className="scrim-x absolute inset-0 opacity-80" />
      </div>

      <div className="gutter relative flex min-h-150 items-end gap-10 pb-32 pt-[calc(var(--nav-h)+3rem)] lg:h-[min(88vh,860px)] lg:justify-between">
        {/* key: al cambiar de slide el bloque entero se vuelve a montar y entra. */}
        <div key={id} className="flex max-w-3xl animate-fade-up flex-col gap-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs uppercase tracking-[0.14em] text-fg/80">
            <span className="cut-xs bg-accent px-3 py-1 font-bold text-accent-fg">
              Tendencia {String(active + 1).padStart(2, '0')}
            </span>
            {status && (
              <span className="inline-flex items-center gap-2">
                {current.status === 'Currently Airing' && <span className="size-1.5 animate-pulse rounded-full bg-accent" />}
                {status}
              </span>
            )}
          </div>

          <h1 className="font-display-tight text-[clamp(2.25rem,5.4vw,4.75rem)] font-bold drop-shadow-[0_4px_24px_rgb(0_0_0/0.45)]">
            {title(current)}
          </h1>

          <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[13px] uppercase tracking-wider text-fg/85">
            {rating && (
              <li className="inline-flex items-center gap-1.5 font-bold text-data tnum">
                <Icon name="star" className="size-4" />
                {rating}
              </li>
            )}
            {[year(current), current.type, count && `${count} ${t('eps')}`, studio]
              .filter(Boolean)
              .map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span aria-hidden="true" className="text-accent-text">/</span>
                  {item}
                </li>
              ))}
          </ul>

          {text && (
            <p className="line-clamp-3 max-w-xl text-base leading-relaxed text-fg/80 md:text-[17px]">
              {text}
            </p>
          )}

          {genres.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <li key={genre.id}>
                  <Link
                    to={genreLink(allGenres, genre)}
                    className="cut-xs relative block px-3 py-1 font-mono text-xs uppercase tracking-wider text-fg/85 cut-ring [--ring-color:color-mix(in_oklab,var(--fg)_25%,transparent)] transition-colors hover:bg-accent hover:text-accent-fg hover:[--ring-color:var(--accent)]"
                  >
                    {genre.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Button
              as={Link}
              to={current.available ? `/watch/${id}/1` : `/anime/${id}`}
              size="xl"
              color="accent"
              icon={<Icon name="play" className="size-5" />}
            >
              {t('Watch now')}
            </Button>

            <Button
              type="button"
              size="xl"
              color="glass"
              onClick={onList}
              aria-pressed={Boolean(listed[id])}
              icon={<Icon name={listed[id] ? 'check' : 'plus'} className="size-5" />}
            >
              {listed[id] ? 'En tu lista' : t('Add to list')}
            </Button>
          </div>
        </div>

        {/* Poster nitido en marco de HUD + titulo en vertical: la firma del hero. */}
        <div key={`art-${id}`} className="hidden animate-fade-in items-end gap-6 pb-1 lg:flex">
          {full.titleJapanese && (
            <p
              aria-hidden="true"
              lang="ja"
              className="vertical-jp max-h-88 overflow-hidden text-[1.7rem] font-bold text-fg/55"
            >
              {full.titleJapanese}
            </p>
          )}

          <Link to={`/anime/${id}`} tabIndex={-1} aria-hidden="true" className="hud block p-2.5">
            <img
              src={image(current)}
              alt=""
              className="cut-lg aspect-2/3 w-62.5 object-cover xl:w-71.25"
            />
          </Link>
        </div>
      </div>

      {/* Selector: una pista por titulo; la activa se llena y avanza al terminar. */}
      <div className="gutter absolute inset-x-0 bottom-0 pb-8">
        <ol className="grid grid-cols-5 gap-2 sm:gap-4">
          {slides.map((item, index) => {
            const on = index === active;

            return (
              <li key={malId(item)}>
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={`${index + 1}: ${title(item)}`}
                  aria-current={on || undefined}
                  className="group/slide flex w-full cursor-pointer flex-col gap-2.5 text-left"
                >
                  <span className="relative block h-0.75 w-full overflow-hidden bg-fg/20">
                    {on && (
                      <span
                        key={`${id}-${reduced}`}
                        onAnimationEnd={next}
                        style={reduced ? { transform: 'scaleX(1)' } : { animationDuration: `${SLIDE_MS}ms` }}
                        className={clsx(
                          'absolute inset-0 origin-left bg-accent',
                          !reduced && 'animate-[hero-progress_linear_both]',
                          'group-hover/hero:[animation-play-state:paused] group-focus-within/hero:[animation-play-state:paused]',
                        )}
                      />
                    )}
                  </span>

                  <span
                    className={clsx(
                      'hidden items-baseline gap-2 truncate font-mono text-xs uppercase tracking-wider transition-colors duration-300 md:flex',
                      on ? 'text-fg' : 'text-fg/45 group-hover/slide:text-fg/80',
                    )}
                  >
                    <span className={clsx('tnum', on && 'text-accent-text')}>{String(index + 1).padStart(2, '0')}</span>
                    <span className="truncate">{title(item)}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

export default Hero
