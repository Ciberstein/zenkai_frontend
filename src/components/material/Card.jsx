import clsx from 'clsx';

// ─── Card ─────────────────────────────────────────────────────────────────────

export const Card = ({ children, className = '', as: As = 'div', ...props }) => (
  <As {...props} className={clsx('panel p-4', className)}>
    {children}
  </As>
);

export const CardTitle = ({ children, className = '', as: As = 'h2', ...props }) => (
  <As {...props} className={clsx('text-lg font-semibold', className)}>
    {children}
  </As>
);

export default Card;
