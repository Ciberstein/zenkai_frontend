import clsx from 'clsx';

// ─── Textarea ─────────────────────────────────────────────────────────────────

export const Textarea = ({
  label = null,
  className = '',
  full = false,
  rows = 3,
  register = {
    function: null,
    errors: { function: null, rules: {} },
  },
  ...props
}) => {
  const error = register.errors.function?.[props.name];
  const describedBy = error ? `${props.name}-error` : undefined;

  return (
    <div className={clsx('flex flex-col gap-1.5', full && 'w-full')}>
      {label && (
        <label htmlFor={props.id ?? props.name} className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          {label}
        </label>
      )}

      <textarea
        {...props}
        id={props.id ?? props.name}
        rows={rows}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        className={clsx(
 'w-full resize-y bg-surface px-3.5 py-2.5 text-sm text-fg',
 'border transition-colors duration-150 placeholder:text-muted focus-visible:outline-none',
          error ? 'border-red-500/70 focus:border-red-500' : 'border-line focus:border-accent',
          className,
        )}
        {...(register.function && register.function(props.name, register.errors.rules))}
      />

      {error?.message && (
        <span id={describedBy} role="alert" className="text-xs text-red-400">
          {error.message}
        </span>
      )}
    </div>
  );
};

export default Textarea;
