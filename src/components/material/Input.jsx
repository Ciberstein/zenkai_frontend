import clsx from 'clsx';
import { Link } from 'react-router-dom';

// ─── Constants ────────────────────────────────────────────────────────────────

const SIZES = {
  sm: 'h-8 text-xs px-3',
  md: 'h-10 text-sm px-3.5',
  lg: 'h-12 text-base px-4',
  xl: 'h-14 text-lg px-5',
};

// ─── Input ────────────────────────────────────────────────────────────────────

export const Input = ({
  label = null,
  type = 'text',
  className = '',
  size = 'md',
  icon = null,
  element = null,
  full = false,
  helperLink = { url: null, text: null },
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
      {(label || helperLink.url) && (
        <div className="flex items-baseline justify-between gap-2">
          {label && (
            <label htmlFor={props.id ?? props.name} className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
              {label}
            </label>
          )}

          {helperLink.url && (
            <Link to={helperLink.url} className="text-xs font-medium text-accent-text hover:underline">
              {helperLink.text}
            </Link>
          )}
        </div>
      )}

      <div
        className={clsx(
 'flex items-center gap-2 bg-surface',
          // El borde se ilumina al enfocar en vez de crecer: el salto de 1 a
          // 2px moveria el contenido de al lado.
 'border transition-colors duration-150',
          error
            ? 'border-red-500/70 focus-within:border-red-500'
            : 'border-line focus-within:border-accent',
          props.disabled && 'opacity-50',
          SIZES[size],
          className,
        )}
      >
        {icon && <span className="shrink-0 text-muted">{icon}</span>}

        <input
          {...props}
          id={props.id ?? props.name}
          type={type}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          className="w-full bg-transparent text-fg placeholder:text-muted focus-visible:outline-none disabled:cursor-not-allowed"
          {...(register.function && register.function(props.name, register.errors.rules))}
        />

        {element}
      </div>

      {error?.message && (
        <span id={describedBy} role="alert" className="text-xs text-red-400">
          {error.message}
        </span>
      )}
    </div>
  );
};

export default Input;
