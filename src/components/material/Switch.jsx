import clsx from 'clsx';

// ─── Switch ───────────────────────────────────────────────────────────────────

export const Switch = ({ checked = false, onChange = () => {}, label = null, className = '' }) => (
  <label className={clsx('inline-flex cursor-pointer items-center gap-2.5', className)}>
    <input
      type="checkbox"
      role="switch"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="peer sr-only"
    />

    <span
      aria-hidden="true"
      className={clsx(
 'relative h-6 w-11 border border-line bg-surface-2 transition-colors duration-200',
 'peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-bg',
        checked && 'border-accent bg-accent',
      )}
    >
      <span
        className={clsx(
 'absolute top-0.75 size-4 bg-white shadow-sm transition-[left] duration-200 ease-out',
          checked ? 'left-5.5' : 'left-0.75',
        )}
      />
    </span>

    {label && <span className="text-sm select-none">{label}</span>}
  </label>
);

export default Switch;
