import React from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../shared/Navbar'
import Sidebar from '../shared/Sidebar'
import Footer from '../shared/Footer'

// ─── useTitle ─────────────────────────────────────────────────────────────────

const useTitle = (suffix = null) => {

  const config = useSelector(state => state.config);
  const { t } = useTranslation();
  const location = useLocation().pathname;

  React.useEffect(() => {
    const name = config?.['project_name'] ?? 'Zenkai';
    const section = suffix ?? location.split('/')[1];
    const label = section
      ? t(section.charAt(0).toUpperCase() + section.slice(1))
      : null;

    document.title = label ? `${name} — ${label}` : name;
  }, [config, location, suffix, t]);
};

// ─── User ─────────────────────────────────────────────────────────────────────

// Marco publico del sitio. `auth` solo cambia lo que muestra la barra: el
// catalogo se navega igual con o sin sesion.
const User = ({ children, auth = false }) => {

  useTitle();

  return (
    <div className="flex min-h-screen flex-col bg-bg pb-20 text-fg md:pb-0">
      <Navbar.User auth={auth} />

      <main className="gutter flex-1 pt-[calc(var(--nav-h)+1.5rem)]">
        {children}
      </main>

      <Footer.User />
    </div>
  )
}

// ─── Watch ────────────────────────────────────────────────────────────────────

// El reproductor manda: sin ancho maximo ni pie, y siempre en oscuro aunque el
// resto del sitio este en claro, que es como se ve un video.
const Watch = ({ children, auth = false }) => {

  useTitle('Watch');

  return (
    <div className="dark min-h-screen bg-bg text-fg">
      <Navbar.User auth={auth} />
      <main className="w-full">{children}</main>
    </div>
  )
}

// ─── Admin ────────────────────────────────────────────────────────────────────

const Admin = ({ children }) => {

  useTitle('Admin');

  return (
    <div className="flex min-h-screen flex-col bg-bg text-fg">
      <Navbar.Admin />

      <div className="mx-auto flex w-full max-w-375 flex-1">
        <Sidebar.Admin />
        <main className="w-full min-w-0 p-4">{children}</main>
      </div>
    </div>
  )
}

const Layouts = { User, Watch, Admin };

export default Layouts
