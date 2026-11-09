import React from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import Brand from './Brand'

// ─── Constants ────────────────────────────────────────────────────────────────

const GROUPS = [
  {
    title: 'Explorar',
    links: [
      { to: '/catalog', label: 'Catalog' },
      { to: '/seasons', label: 'Seasons' },
      { to: '/schedule', label: 'Schedule' },
      { to: '/search', label: 'Search' },
    ],
  },
  {
    title: 'Tu cuenta',
    links: [
      { to: '/watchlist', label: 'Watchlist' },
      { to: '/favorites', label: 'Favorites' },
      { to: '/history', label: 'History' },
      { to: '/settings', label: 'Settings' },
    ],
  },
];

const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
];

// ─── User ─────────────────────────────────────────────────────────────────────

const User = () => {

  const config = useSelector(state => state.config);
  const { t, i18n } = useTranslation();

  const name = config?.['project_name'] ?? 'Zenkai';

  const setLanguage = (code) => {
    localStorage.setItem('lang', code);
    i18n.changeLanguage(code);
  };

  return (
    <footer className="relative mt-24 border-t border-line bg-surface/40">
      <div aria-hidden="true" className="hazard absolute inset-x-0 top-0 h-1.5" />
      <div className="gutter grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex max-w-xs flex-col gap-4">
          <Brand name={name} />
          <p className="text-sm leading-relaxed text-muted">
            Descubre, sigue y retoma tus series donde las dejaste.
          </p>
        </div>

        {GROUPS.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h2 className="mb-4 font-mono text-xs font-normal tracking-[0.16em] text-accent-text">
              {group.title}
            </h2>
            <ul className="flex flex-col gap-2.5">
              {group.links.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-fg/80 transition-colors hover:text-accent-text">
                    {t(label)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <h2 className="mb-4 font-mono text-xs font-normal tracking-[0.16em] text-accent-text">
            Idioma
          </h2>
          <ul className="flex flex-col gap-2.5">
            {LANGUAGES.map(({ code, label }) => (
              <li key={code}>
                <button
                  type="button"
                  onClick={() => setLanguage(code)}
                  aria-pressed={i18n.language === code}
                  className={
                    i18n.language === code
                      ? 'cursor-pointer text-sm font-semibold text-accent-text'
                      : 'cursor-pointer text-sm text-fg/80 transition-colors hover:text-accent-text'
                  }
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="gutter flex flex-wrap items-center justify-between gap-3 py-5 text-xs text-muted">
          <p>© {new Date().getFullYear()} {name}. Metadatos por MyAnimeList.</p>
          <p aria-hidden="true" className="font-jp tracking-[0.3em]">全開</p>
        </div>
      </div>
    </footer>
  )
}

const Footer = { User };

export default Footer
