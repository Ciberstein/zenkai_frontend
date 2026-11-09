import clsx from 'clsx';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = {
  accent: 'bg-accent text-accent-fg',
  solid: 'bg-fg text-bg',
  // Cristal sobre imagen: es lo que permite leer una etiqueta encima de
  // cualquier portada sin saber de que color es.
  glass: 'cut-ring bg-black/65 text-white backdrop-blur-md [--ring-color:rgb(255_255_255/0.15)]',
  soft: 'bg-surface-2 text-muted',
  outline: 'cut-ring text-muted [--ring-color:var(--line)]',
  danger: 'bg-red-500/15 text-red-400',
};

// ─── Tag ──────────────────────────────────────────────────────────────────────

// Etiqueta de HUD: monoespaciada, en mayusculas, con una esquina cortada.
export const Tag = ({
  children,
  color = 'soft',
  className = '',
  as: As = 'span',
  ...props
}) => (
  <As
    {...props}
    className={clsx(
      'cut-xs relative inline-flex items-center gap-1.5 px-2.5 py-0.5',
      'font-mono text-[11px] uppercase leading-5 tracking-[0.12em]',
      COLORS[color],
      className,
    )}
  >
    {children}
  </As>
);

export default Tag;
