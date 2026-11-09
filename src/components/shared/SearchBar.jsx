import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon from './Icon'
import clsx from 'clsx'

// ─── SearchBar ────────────────────────────────────────────────────────────────

// Colapsada es un icono; al abrirla crece hacia la izquierda. La tecla "/"
// la abre desde cualquier pantalla, como en las plataformas grandes.
const SearchBar = ({ className = '' }) => {

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const input = React.useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  React.useEffect(() => {
    const onKey = (event) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName) || event.target.isContentEditable;
      if (event.key === '/' && !typing) {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  React.useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  // Al cambiar de pantalla la barra vuelve a su estado de reposo.
  React.useEffect(() => {
    setOpen(false);
    setQuery('');
  }, [location.pathname]);

  const onSubmit = (event) => {
    event.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      className={clsx(
        'flex h-10 items-center transition-[width,background-color,box-shadow] duration-300 ease-out-expo',
        open
          ? 'w-56 bg-surface-2/80 ring-1 ring-line sm:w-72'
          : 'w-10 bg-transparent hover:bg-surface-2/70',
        className,
      )}
    >
      <button
        type={open ? 'submit' : 'button'}
        onClick={() => !open && setOpen(true)}
        aria-label={t('Search')}
        className="grid size-10 shrink-0 cursor-pointer place-items-center text-fg"
      >
        <Icon name="search" className="size-4.75" />
      </button>

      <input
        ref={input}
        type="search"
        value={query}
        tabIndex={open ? 0 : -1}
        onChange={(event) => setQuery(event.target.value)}
        onBlur={() => !query && setOpen(false)}
        aria-label={t('Search')}
        placeholder="Títulos, géneros…"
        className={clsx(
          'h-full min-w-0 flex-1 bg-transparent pr-4 text-sm text-fg',
          'placeholder:text-muted focus-visible:outline-none',
          '[&::-webkit-search-cancel-button]:hidden',
          !open && 'pointer-events-none w-0 opacity-0',
        )}
      />
    </form>
  )
}

export default SearchBar
