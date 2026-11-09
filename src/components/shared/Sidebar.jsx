import React from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEMS = [
  { to: '/admin', label: 'Panel', end: true },
  { to: '/admin/catalog', label: 'Catalog' },
  { to: '/admin/accounts', label: 'Cuentas' },
  { to: '/admin/jobs', label: 'Tareas' },
  { to: '/admin/logs', label: 'Logs' },
  { to: '/admin/settings', label: 'Settings' },
];

// ─── Admin ────────────────────────────────────────────────────────────────────

const Admin = () => {

  const { t } = useTranslation();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-line p-3 lg:block">
      <nav>
        <ul className="flex flex-col gap-1">
          {ITEMS.map(({ to, label, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) => clsx(
 'block px-3 py-2 text-sm transition-colors duration-150',
                  isActive
                    ? 'bg-accent/10 font-semibold text-accent-text'
                    : 'text-muted hover:bg-surface hover:text-fg',
                )}
              >
                {t(label)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

const Sidebar = { Admin };

export default Sidebar
