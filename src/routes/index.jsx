import React from 'react'
import { Context } from '../context';
import { Navigate, Outlet } from 'react-router-dom';
import Layouts from '../components/layouts';

// Las rutas de usuario no exigen sesion: un invitado navega el catalogo
// completo con el layout publico y solo se le pide login al reproducir.
const User = () => {

  const { auth, loading } = React.useContext(Context.Auth);

  if (loading) return null;

  return (
    <Layouts.User auth={auth}>
      <Outlet />
    </Layouts.User>
  )
}

// Estas si: sin sesion iniciada se va al login y se vuelve despues.
const Private = () => {

  const { auth, loading } = React.useContext(Context.Auth);

  if (loading) return null;
  if (!auth) return <Navigate to="/login" replace />;

  return (
    <Layouts.User auth={auth}>
      <Outlet />
    </Layouts.User>
  )
}

const Admin = () => {

  const { staff, loading } = React.useContext(Context.Admin);

  if (loading) return null;
  if (!staff) return <Navigate to="/" replace />;

  return (
    <Layouts.Admin>
      <Outlet />
    </Layouts.Admin>
  )
}

// Dentro del panel, lo que el moderador no puede tocar: cuentas, tareas, logs y ajustes.
const AdminOnly = () => {

  const { admin, loading } = React.useContext(Context.Admin);

  if (loading) return null;
  if (!admin) return <Navigate to="/admin/catalog" replace />;

  return <Outlet />
}

// El reproductor tiene su propio marco a pantalla completa.
const Watch = () => {

  const { auth, loading } = React.useContext(Context.Auth);

  if (loading) return null;

  return (
    <Layouts.Watch auth={auth}>
      <Outlet />
    </Layouts.Watch>
  )
}

const Protected = { User, Private, Admin, AdminOnly, Watch };

export default Protected;
