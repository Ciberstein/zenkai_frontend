import clsx from 'clsx';

// ─── Checkbox ─────────────────────────────────────────────────────────────────

// Se mantiene el <input> real (solo visualmente oculto) para no perder teclado,
// formularios ni lectores de pantalla; la caja visible es su hermana.
export const Checkbox = ({
  label = null,
  className = '',
  register = { function: null, errors: { function: null, rules: {} } },
  ...props
}) => (
  <label className={clsx('inline-flex cursor-pointer items-center gap-2.5', className)}>
    <input
      {...props}
      type="checkbox"
      className="peer sr-only"
      {...(register.function && register.function(props.name, register.errors.rules))}
    />

    <span
      aria-hidden="true"
      className={clsx(
 'grid size-4.5 shrink-0 place-items-center border border-line bg-surface',
 'transition-colors duration-150',
 'peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-bg',
 'peer-checked:border-accent peer-checked:bg-accent',
        // La marca esta anidada y `peer-checked` solo alcanza a hermanos: se
        // llega a ella con un selector descendente explicito.
 'peer-checked:[&>svg]:opacity-100',
      )}
    >
      <svg viewBox="0 0 16 16" className="size-3 opacity-0 transition-opacity duration-150">
        <path d="M3.5 8.5 6.5 11.5 12.5 5" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>

    {label && <span className="text-sm select-none">{label}</span>}
  </label>
);

export default Checkbox;
