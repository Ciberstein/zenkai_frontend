import { Dialog as HeadlessDialog, DialogPanel, DialogTitle } from '@headlessui/react';
import clsx from 'clsx';

// ─── Constants ────────────────────────────────────────────────────────────────

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

// ─── Dialog ───────────────────────────────────────────────────────────────────

// Headless UI se encarga del foco atrapado, el Escape y el aria-modal; aqui
// solo va el aspecto.
export const Dialog = ({
  open = false,
  onClose = () => {},
  title = null,
  children,
  actions = null,
  size = 'md',
  className = '',
}) => (
  <HeadlessDialog open={open} onClose={onClose} className="relative z-50">
    <div className="fixed inset-0 animate-fade-in bg-black/70 backdrop-blur-sm" aria-hidden="true" />

    <div className="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel
        className={clsx(
 'w-full animate-fade-up overflow-hidden bg-surface',
 'border border-line shadow-2xl shadow-black/50',
          SIZES[size],
          className,
        )}
      >
        {title && (
          <DialogTitle className="border-b border-line px-5 py-4 text-base font-semibold">
            {title}
          </DialogTitle>
        )}

        <div className="flex flex-col gap-4 p-5">{children}</div>

        {actions && (
          <div className="flex justify-end gap-2 border-t border-line bg-bg/40 px-5 py-3.5">
            {actions}
          </div>
        )}
      </DialogPanel>
    </div>
  </HeadlessDialog>
);

export default Dialog;
