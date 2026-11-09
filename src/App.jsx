import { darkThunk } from './store/slices/dark.slice'
import { Navigate, Route, Routes } from 'react-router-dom'
import { User, Admin, Auth } from './components/pages'
import { BrowserRouter as Router } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { configThunk } from './store/slices/config.slice'
import { genresThunk } from './store/slices/genres.slice'
import Protected from './routes';
import React from 'react'
import './App.css'
import i18n from '../i18n'


function App() {

  const dark = useSelector((state) => state.dark);
  const dispatch = useDispatch();

  React.useEffect(() => {
    const lang = localStorage.getItem('lang') ?? 'es';
    localStorage.setItem('lang', lang);
    i18n.changeLanguage(lang);
  }, []);

  React.useEffect(() => {
    dispatch(configThunk());
    dispatch(genresThunk());
  }, []);

  // El tema ya no pasa por ningun proveedor: `darkThunk` alterna la clase en
  // <html> y los tokens CSS hacen el resto.
  React.useEffect(() => {
    dispatch(darkThunk());
  }, [dark]);

  return (
    <Router>
      <Routes>

        {/* Auth routes */}
        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/login" element={<Auth.Pages.Login />} />
        <Route path="/register" element={<Auth.Pages.Register />} />
        <Route path="/recovery" element={<Auth.Pages.Recovery />} />

        {/* Catalog routes (publicas) */}
        <Route path="/" element={<Protected.User />} >
          <Route index element={<User.Pages.Home />} />
          <Route path="/catalog" element={<User.Pages.Catalog />} />
          <Route path="/search" element={<User.Pages.Search />} />
          <Route path="/seasons/:year?/:season?" element={<User.Pages.Seasons />} />
          <Route path="/schedule" element={<User.Pages.Schedule />} />
          <Route path="/anime/:malId" element={<User.Pages.Anime />} />
          <Route path="/profile/:id?" element={<User.Pages.Profile />} />
        </Route>

        {/* Reproductor: marco propio a pantalla completa */}
        <Route path="/" element={<Protected.Watch />} >
          <Route path="/watch/:malId/:number" element={<User.Pages.Watch />} />
        </Route>

        {/* Library routes (requieren sesion) */}
        <Route path="/" element={<Protected.Private />} >
          <Route path="/watchlist" element={<User.Pages.Watchlist />} />
          <Route path="/favorites" element={<User.Pages.Favorites />} />
          <Route path="/history" element={<User.Pages.History />} />
          <Route path="/settings" element={<User.Pages.Settings />} />
        </Route>

        {/* Admin routes */}
        <Route path="/admin" element={<Protected.Admin />} >
          <Route index element={<Admin.Pages.Home />} />
          <Route path="/admin/catalog" element={<Admin.Pages.Catalog />} />
          <Route path="/admin/catalog/:id" element={<Admin.Pages.Episodes />} />
          <Route path="/admin/accounts" element={<Admin.Pages.Accounts />} />
          <Route path="/admin/jobs" element={<Admin.Pages.Jobs />} />
          <Route path="/admin/logs" element={<Admin.Pages.Logs />} />
          <Route path="/admin/settings" element={<Admin.Pages.Settings />} />
        </Route>

      </Routes>
    </Router>
  );
}

export default App
