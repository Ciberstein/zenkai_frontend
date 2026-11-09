import React from 'react'
import { Link } from 'react-router-dom'
import AnimeCard from './AnimeCard'
import Icon from './Icon'
import clsx from 'clsx'

// ─── Arrow ────────────────────────────────────────────────────────────────────

const Arrow = ({ side, disabled, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    tabIndex={-1}
    aria-label={side === 'left' ? 'Anterior' : 'Siguiente'}
    className={clsx(
      'absolute top-0 z-20 hidden h-[calc(100%-3.5rem)] w-14 cursor-pointer items-center md:flex',
      'text-white opacity-0 transition-opacity duration-300',
      'group-hover/rail:opacity-100 disabled:opacity-0! disabled:pointer-events-none',
      side === 'left'
        ? 'left-0 justify-start bg-linear-to-r from-bg to-transparent pl-1.5'
        : 'right-0 justify-end bg-linear-to-l from-bg to-transparent pr-1.5',
    )}
  >
    <span className="cut-sm grid size-10 place-items-center bg-accent text-accent-fg transition-transform hover:scale-110">
      <Icon name={side === 'left' ? 'chevron-left' : 'chevron-right'} className="size-5" />
    </span>
  </button>
)

// ─── Rail ─────────────────────────────────────────────────────────────────────

// Fila horizontal con scroll nativo y snap: mas fluido en movil que un carrusel
// con JS, y no rompe el teclado ni el lector de pantalla. Las flechas solo
// aparecen en escritorio y solo cuando hay hacia donde ir.
const Rail = ({ title, items = [], to = null, ranked = false, render = null, eyebrow = null }) => {

  const scroller = React.useRef(null);
  const [edge, setEdge] = React.useState({ start: true, end: false });

  const measure = React.useCallback(() => {
    const node = scroller.current;
    if (!node) return;
    setEdge({
      start: node.scrollLeft <= 4,
      end: node.scrollLeft + node.clientWidth >= node.scrollWidth - 4,
    });
  }, []);

  React.useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure, items.length]);

  const page = (direction) => () => {
    const node = scroller.current;
    node?.scrollBy({ left: direction * node.clientWidth * 0.85, behavior: 'smooth' });
  };

  if (!items.length) return null;

  const list = ranked ? items.slice(0, 10) : items;

  return (
    <section className="group/rail relative flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2 className="text-[24px] md:text-[32px]">{title}</h2>
        </div>

        {to && (
          <Link
            to={to}
            className="group/link inline-flex shrink-0 items-center gap-1.5 pb-1 font-mono text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:text-accent-text"
          >
            Ver todo
            <Icon name="arrow-right" className="size-4 transition-transform duration-300 group-hover/link:translate-x-1" />
          </Link>
        )}
      </div>

      <div className="relative -mx-4 sm:-mx-6 lg:-mx-10">
        <Arrow side="left" disabled={edge.start} onClick={page(-1)} />
        <Arrow side="right" disabled={edge.end} onClick={page(1)} />

        <div
          ref={scroller}
          onScroll={measure}
          className="no-scrollbar stagger flex snap-x snap-mandatory gap-3.5 overflow-x-auto scroll-px-4 px-4 pb-4 pt-2 sm:scroll-px-6 sm:px-6 lg:scroll-px-10 lg:px-10"
        >
          {list.map((item, index) => (
            <div
              key={item.id ?? item.mal_id ?? index}
              className={clsx(
                'shrink-0 snap-start',
                ranked
                  ? 'relative w-46 sm:w-52 md:w-60'
                  : 'w-35 sm:w-40 md:w-44 lg:w-48',
              )}
            >
              {ranked && (
                <span
                  aria-hidden="true"
                  className="rank-numeral pointer-events-none absolute -left-1 bottom-[3.4rem] select-none text-[8rem] md:text-[10.5rem]"
                >
                  {index + 1}
                </span>
              )}

              {render
                ? render(item, index)
                : <AnimeCard anime={item} className={ranked ? 'relative ml-auto w-[62%]' : ''} />}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Rail
