import clsx from 'clsx';

// ─── Constants ────────────────────────────────────────────────────────────────

const SIZES = {
  sm: 'h-8 px-3.5 text-xs gap-1.5',
  md: 'h-10 px-5 text-sm gap-2',
  lg: 'h-12 px-7 text-[15px] gap-2.5',
  xl: 'h-14 px-9 text-base gap-3',
};

// Todos los botones van recortados (`cut`), asi que ninguno usa sombra exterior:
// el recorte la comeria. El contorno es `cut-ring`, que sigue la diagonal.
const COLORS = {
  accent: 'bg-accent text-accent-fg hover:brightness-110 active:brightness-95',
  light: 'bg-fg text-bg hover:opacity-90',
  soft: 'bg-surface-2 text-fg hover:bg-line',
  // Cristal sobre imagen: el segundo boton del hero.
  glass: 'cut-ring bg-fg/10 text-fg [--ring-color:color-mix(in_oklab,var(--fg)_25%,transparent)] backdrop-blur-md hover:bg-fg/20',
  ghost: 'bg-transparent text-fg hover:bg-surface-2',
  outline: 'cut-ring bg-transparent text-fg [--ring-color:color-mix(in_oklab,var(--fg)_30%,transparent)] hover:bg-fg/10 hover:[--ring-color:color-mix(in_oklab,var(--fg)_60%,transparent)]',
  danger: 'cut-ring bg-red-500/12 text-red-400 [--ring-color:rgb(239_68_68/0.4)] hover:bg-red-500/20',
};

// ─── Button ───────────────────────────────────────────────────────────────────

export const Button = ({
  as: As = 'button',
  children = '',
  className = '',
  color = 'accent',   // 'accent' | 'light' | 'soft' | 'glass' | 'ghost' | 'outline' | 'danger'
  size = 'md',        // 'sm' | 'md' | 'lg' | 'xl'
  icon = null,
  full = false,
  loading = false,
  ...props
}) => (
  <As
    {...props}
    disabled={props.disabled || loading}
    aria-busy={loading || undefined}
    className={clsx(
      'cut cut-focus relative inline-flex shrink-0 items-center justify-center',
      'font-display font-bold uppercase tracking-[0.08em]',
      'cursor-pointer select-none transition-[filter,background-color,opacity,transform,box-shadow] duration-200',
      'active:translate-y-px',
      'disabled:pointer-events-none disabled:opacity-45',
      SIZES[size],
      COLORS[color],
      full && 'w-full',
      className,
    )}
  >
    {loading
      ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
      : icon}
    {children}
  </As>
);

export default Button;
