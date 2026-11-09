import clsx from 'clsx';

/* DATA
  items = [{ value: 'watching', label: 'Viendo' }]
*/

// ─── Tabs ─────────────────────────────────────────────────────────────────────

// Pestanas como botones tabulables, con roles ARIA correctos: son navegacion
// real, no un grupo de divs con onClick.
export const Tabs = ({ items = [], value = null, onChange = () => {}, className = '' }) => (
  <div
    role="tablist"
    className={clsx('no-scrollbar flex gap-1 overflow-x-auto bg-surface p-1 ring-1 ring-inset ring-line', className)}
  >
    {items.map((item) => {
      const active = String(item.value) === String(value);

      return (
        <button
          key={String(item.value)}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(item.value)}
          className={clsx(
 'cut-xs shrink-0 cursor-pointer px-4 py-1.5 font-display text-sm font-semibold uppercase tracking-[0.08em] transition-colors duration-200',
            active ? 'bg-accent text-accent-fg' : 'text-muted hover:text-fg',
          )}
        >
          {item.label}
        </button>
      );
    })}
  </div>
);

export default Tabs;
