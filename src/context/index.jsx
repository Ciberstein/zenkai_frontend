import { accountThunk } from '../store/slices/account.slice';
import auth_service from '../services/auth.services';
import { useDispatch, useSelector } from 'react-redux';
import React from "react";
import { ROLES } from '../utils/roles';

const AuthContext = React.createContext();
const AdminContext = React.createContext();

const AuthProvider = ({ children }) => {

  const [auth, setAuth] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const dispatch = useDispatch();

  const checkAuth = async () => {
    const res = await auth_service.validate();
    if (res) dispatch(accountThunk());
    setAuth(res);
    setLoading(false);
  };

  React.useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ auth, setAuth, loading }}>
      {children}
    </AuthContext.Provider>
  )
};

const AdminProvider = ({ children }) => {

  const { auth, loading: authLoading } = React.useContext(Context.Auth);
  const [staff, setStaff] = React.useState(false);   // moderador o superior: entra al panel
  const [admin, setAdmin] = React.useState(false);    // administrador: todo el panel
  const [loading, setLoading] = React.useState(true);

  const account = useSelector(state => state.account);

  React.useEffect(() => {
    if (authLoading) return;

    if (!auth) {
      setStaff(false);
      setAdmin(false);
      setLoading(false);
      return;
    }

    // La cuenta llega por thunk despues de validar, asi que se espera a
    // tenerla antes de decidir: si no, el panel parpadearia y redirigiria.
    if (!account?.id) return;

    setStaff(account.authority >= ROLES.MODERATOR);
    setAdmin(account.authority >= ROLES.ADMIN);
    setLoading(false);
  }, [auth, authLoading, account?.id]);

  return (
    <AdminContext.Provider value={{ staff, admin, loading }}>
      {children}
    </AdminContext.Provider>
  )
};

export const Context = {
  Auth: AuthContext,
  Admin: AdminContext,
};

export const Provider = {
  Auth: AuthProvider,
  Admin: AdminProvider,
};

export default Provider;
