import appError from "../utils/appError";
import api from "../api/axios";

const disconnect = async () => {
  const url = '/api/v1/auth/logout';
  await api
    .post(url)
    .then(() => location.reload())
    .catch((err) => appError(err))
};

const refresh = async () => {
  const url = `/api/v1/auth/refresh`;
  await api.post(url, {}, { withCredentials: true })
    .then((res) => console.log(res.data.message))
    .catch(async () => await disconnect())
};

const validate = async () => {
  let response = false;

  const url = '/api/v1/auth/validate';
  await api.post(url)
    .then((res) => response = res.data.auth)
    .catch((err) => appError(err))

  return response;
};

const login = async (credentials) => {
  const url = '/api/v1/auth/login';
  return await api.post(url, credentials);
};

const register = async (credentials) => {
  const url = '/api/v1/auth/register';
  return await api.post(url, credentials);
};

// Confirma el correo con el código recibido y abre la sesión.
const verify = async (data) => await api.post('/api/v1/auth/verify', data);

const resend = async (email) => await api.post('/api/v1/auth/verify/resend', { email });

// Recuperar la contraseña: pedir el código por correo y cambiarla con él.
const recover = async (email) => await api.post('/api/v1/auth/recovery', { email });

const reset = async (data) => await api.post('/api/v1/auth/recovery/reset', data);

const auth = { disconnect, refresh, validate, login, register, verify, resend, recover, reset };

export default auth;
