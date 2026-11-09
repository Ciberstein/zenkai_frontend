import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { setDark } from '../../store/slices/dark.slice'
import auth_service from '../../services/auth.services'
import SearchBar from './SearchBar'
import Avatar from './Avatar'
import Brand from './Brand'
import Icon from './Icon'
import clsx from 'clsx'

// ─── Constants ────────────────────────────────────────────────────────────────

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/catalog', label: 'Catalog' },
  { to: '/seasons', label: 'Seasons' },
  { to: '/schedule', label: 'Schedule' },
];

// Barra inferior del movil: los cinco destinos de uso diario, al alcance del
// pulgar. Perfil se resuelve en el componente segun haya sesion o no.
const TABS = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/catalog', label: 'Catalog', icon: 'grid' },
  { to: '/search', label: 'Search', icon: 'search' },
  { to: '/schedule', label: 'Schedule', icon: 'calendar' },
];

const ITEM = clsx(
  'flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-fg/90',
  'transition-colors data-focus:bg-surface-2 data-focus:text-fg',
);

// ─── User ─────────────────────────────────────────────────────────────────────

const User = ({ auth }) => {

  const [scrolled, setScrolled] = React.useState(false);

  const account = useSelector(state => state.account);
  const config = useSelector(state => state.config);
  const dark = useSelector(state => state.dark);
  const dispatch = useDispatch();
  const { t } = useTranslation();

  // Transparente sobre la portada y de cristal al bajar: el hero se ve entero
  // al entrar y la navegacion sigue legible despues.
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const name = config?.['project_name'] ?? 'Zenkai';

  return (
    <>
      <header
        className={clsx(
          'fixed inset-x-0 top-0 z-40 h-(--nav-h) transition-[background-color,box-shadow,backdrop-filter] duration-500',
          scrolled
            ? 'glass shadow-[0_1px_0_0_var(--line)]'
            : 'bg-linear-to-b from-bg/85 via-bg/35 to-transparent',
        )}
      >
        <nav className="mx-auto flex h-full max-w-375 items-center gap-2 px-4 sm:px-6 lg:px-10">
          <Brand name={name} className="mr-4 lg:mr-8" />

          <ul className="hidden items-center gap-1 md:flex">
            {LINKS.map(({ to, label, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) => clsx(
                    'group relative block px-3.5 py-2 font-display text-[13px] font-semibold uppercase tracking-[0.12em] transition-colors duration-200',
                    isActive ? 'text-fg' : 'text-muted hover:text-fg',
                  )}
                >
                  {({ isActive }) => (
                    <>
                      {t(label)}
                      <span
                        aria-hidden="true"
                        className={clsx(
                          'absolute inset-x-3.5 -bottom-px h-0.5 origin-left bg-accent transition-transform duration-300 ease-out-expo',
                          isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-50',
                        )}
                      />
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="ml-auto flex items-center gap-1">
            <SearchBar className="hidden md:flex" />

            <button
              type="button"
              onClick={() => dispatch(setDark(!dark))}
              aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className={clsx(
                'grid size-10 shrink-0 cursor-pointer place-items-center text-fg transition-colors hover:bg-surface-2/80',
              )}
            >
              <Icon name={dark ? 'sun' : 'moon'} className="size-4.75" />
            </button>

            {auth ? (
              <Menu>
                <MenuButton
                  aria-label="Cuenta"
                  className="ml-1 cursor-pointer transition-opacity hover:opacity-80 data-open:opacity-80"
                >
                  <Avatar src={account?.profile?.avatar} name={account?.username} size="size-9" />
                </MenuButton>

                <MenuItems
                  anchor="bottom end"
                  transition
                  className={clsx(
                    'glass cut z-50 mt-3 w-60 p-2 [--anchor-gap:6px]',
                    'shadow-[0_30px_60px_-20px_rgb(0_0_0/0.8)] text-fg',
                    'origin-top-right transition duration-200 ease-out-expo',
                    'data-closed:-translate-y-1 data-closed:scale-95 data-closed:opacity-0',
                  )}
                >
                  <div className="flex items-center gap-3 px-3 pb-3 pt-2">
                    <Avatar src={account?.profile?.avatar} name={account?.username} size="size-10" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{account?.username}</p>
                      <p className="truncate text-xs text-muted">{account?.email}</p>
                    </div>
                  </div>

                  <div className="border-t border-line pt-1.5">
                    <MenuItem><Link to="/profile" className={ITEM}><Icon name="user" className="size-4.5 text-muted" />{t('Profile')}</Link></MenuItem>
                    <MenuItem><Link to="/watchlist" className={ITEM}><Icon name="list" className="size-4.5 text-muted" />{t('Watchlist')}</Link></MenuItem>
                    <MenuItem><Link to="/favorites" className={ITEM}><Icon name="heart" className="size-4.5 text-muted" />{t('Favorites')}</Link></MenuItem>
                    <MenuItem><Link to="/history" className={ITEM}><Icon name="history" className="size-4.5 text-muted" />{t('History')}</Link></MenuItem>
                    <MenuItem><Link to="/settings" className={ITEM}><Icon name="settings" className="size-4.5 text-muted" />{t('Settings')}</Link></MenuItem>

                    {account?.authority >= 30000 && (
                      <MenuItem><Link to="/admin" className={ITEM}><Icon name="shield" className="size-4.5 text-muted" />Administración</Link></MenuItem>
                    )}
                  </div>

                  <div className="mt-1.5 border-t border-line pt-1.5">
                    <MenuItem>
                      <button
                        type="button"
                        onClick={() => auth_service.disconnect()}
                        className={clsx(ITEM, 'cursor-pointer text-red-400 data-focus:text-red-300')}
                      >
                        <Icon name="logout" className="size-4.5" />
                        {t('Logout')}
                      </button>
                    </MenuItem>
                  </div>
                </MenuItems>
              </Menu>
            ) : (
              <Link
                to="/login"
                className="cut-sm cut-focus ml-2 shrink-0 bg-accent px-5 py-2 font-display text-sm font-bold uppercase tracking-[0.08em] text-accent-fg transition-[filter] hover:brightness-110"
              >
                {t('Login')}
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Barra inferior (solo movil). */}
      <nav
        aria-label="Navegación principal"
        className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="mx-auto flex max-w-md items-stretch justify-around">
          {TABS.map(({ to, label, icon, end }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) => clsx(
                  'flex flex-col items-center gap-1 py-2.5 font-mono text-[10px] uppercase tracking-wider transition-colors',
                  isActive ? 'text-accent-text' : 'text-muted',
                )}
              >
                <Icon name={icon} className="size-5.5" />
                {t(label)}
              </NavLink>
            </li>
          ))}

          <li className="flex-1">
            <NavLink
              to={auth ? '/profile' : '/login'}
              className={({ isActive }) => clsx(
                'flex flex-col items-center gap-1 py-2.5 font-mono text-[10px] uppercase tracking-wider transition-colors',
                isActive ? 'text-accent-text' : 'text-muted',
              )}
            >
              <Icon name="user" className="size-5.5" />
              {auth ? t('Profile') : 'Entrar'}
            </NavLink>
          </li>
        </ul>
      </nav>
    </>
  )
}

// ─── Admin ────────────────────────────────────────────────────────────────────

const Admin = () => {

  const account = useSelector(state => state.account);

  return (
    <header className="border-b border-line bg-surface/60 backdrop-blur">
      <nav className="mx-auto flex max-w-375 items-center gap-4 px-4 py-3 lg:px-8">
        <Brand to="/admin" kanji={false} />
        <span className="bg-surface-2 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-muted">
          Admin
        </span>

        <Link to="/" className="ml-auto inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg">
          <Icon name="arrow-left" className="size-4" />
          Volver al sitio
        </Link>

        <Avatar src={account?.profile?.avatar} name={account?.username} />
      </nav>
    </header>
  )
}

const Navbar = { User, Admin };

export default Navbar
