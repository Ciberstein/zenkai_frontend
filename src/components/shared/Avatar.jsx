import clsx from 'clsx'

// ─── Avatar ───────────────────────────────────────────────────────────────────

// Si no hay imagen cae a la inicial sobre el acento, en vez de a un icono
// generico de persona.
export const Avatar = ({ src = null, name = '', size = 'size-8', className = '' }) => (
  <span
    className={clsx(
 'grid shrink-0 place-items-center cut-sm overflow-hidden bg-accent',
 'font-display text-sm font-bold text-accent-fg',
      size,
      className,
    )}
  >
    {src
      ? <img src={src} alt="" className="size-full object-cover" />
      : (name?.[0]?.toUpperCase() ?? '?')}
  </span>
)

export default Avatar
