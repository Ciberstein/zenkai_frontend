import { accountThunk } from '../store/slices/account.slice';
import auth_service from '../services/auth.services';
import { useDispatch, useSelector } from 'react-redux';
import React from "react";

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
  const [admin, setAdmin] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const account = useSelector(state => state.account);

  React.useEffect(() => {
    if (authLoading) return;

    if (!auth) {
      setAdmin(false);
      setLoading(false);
      return;
    }

    // La cuenta llega por thunk despues de validar, asi que se espera a
    // tenerla antes de decidir: si no, el panel parpadearia y redirigiria.
    if (!account?.id) return;

    setAdmin(account?.authority >= 30000);
    setLoading(false);
  }, [auth, authLoading, account?.id]);

  return (
    <AdminContext.Provider value={{ admin, loading }}>
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
