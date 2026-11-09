import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import React from 'react';
import clsx from 'clsx';

/* DATA
  data = [
    { value: '',  label: 'Todos' },
    { value: 22,  label: 'Romance' },
  ]
*/

// ─── Constants ────────────────────────────────────────────────────────────────

const SIZES = {
  sm: 'h-8 text-xs px-3',
  md: 'h-10 text-sm px-3.5',
  lg: 'h-12 text-base px-4',
  xl: 'h-14 text-lg px-5',
};

// ─── Select ───────────────────────────────────────────────────────────────────

// Listbox de Headless UI en vez de un <select> nativo: el nativo no se puede
// estilar por dentro en la mayoria de navegadores, y hacerlo a mano con divs
// significaria reimplementar teclado, foco y roles ARIA.
export const Select = ({
  label = null,
  className = '',
  size = 'md',
  full = false,
  data = [],
  value = null,
  onChange = () => {},
  placeholder = 'Selecciona',
  name = null,
}) => {
  const selected = React.useMemo(
    () => data.find((item) => String(item.value) === String(value)) ?? null,
    [data, value],
  );

  return (
    <div className={clsx('flex flex-col gap-1.5', full && 'w-full')}>
      {label && <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">{label}</span>}

      <Listbox value={value} onChange={onChange} name={name}>
        <div className="relative">
          <ListboxButton
            className={clsx(
 'flex w-full cursor-pointer items-center justify-between gap-2 bg-surface text-left',
 'border border-line transition-colors duration-150',
 'hover:border-line/80 data-open:border-accent',
              SIZES[size],
              className,
            )}
          >
            <span className={clsx('truncate', selected ? 'text-fg' : 'text-muted')}>
              {selected?.label ?? placeholder}
            </span>

            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              className="size-4 shrink-0 text-muted transition-transform duration-200 group-data-open:rotate-180"
            >
              <path d="M5.5 7.5 10 12l4.5-4.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </ListboxButton>

          <ListboxOptions
            anchor="bottom start"
            transition
            className={clsx(
 'z-50 mt-1.5 max-h-64 w-(--button-width) overflow-auto p-1.5',
 'border border-line bg-surface shadow-xl shadow-black/40',
 'origin-top transition duration-150 ease-out',
 'data-closed:scale-95 data-closed:opacity-0',
 'focus-visible:outline-none',
            )}
          >
            {data.map((item) => (
              <ListboxOption
                key={String(item.value)}
                value={item.value}
                className={clsx(
 'flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm',
 'data-focus:bg-surface-2 data-selected:text-accent-text data-selected:font-semibold',
                )}
              >
                {item.label}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </div>
      </Listbox>
    </div>
  );
};

export default Select;
