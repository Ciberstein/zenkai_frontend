import axios from "axios";
import auth from "../services/auth.services";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error = null) => {
  failedQueue.forEach(({ resolve, reject }) => error ? reject(error) : resolve());
  failedQueue = [];
};

const enqueueRequest = (originalRequest) =>
  new Promise((resolve, reject) => {
    failedQueue.push({ resolve, reject });
  }).then(() => api(originalRequest));

api.interceptors.response.use(
  res => res,
  async err => {
    const { response, config: originalRequest } = err;
    const status = response?.status;

    if (status === 503) {
      await auth.disconnect();
      return Promise.reject(err);
    }

    // Un 401 de login / registro / verificación es una respuesta normal (credenciales o código
    // incorrectos), no una sesión caducada: no hay nada que refrescar ni que recargar.
    const isAuthCall = /\/auth\/(login|register|verify|recovery|refresh|logout)/.test(originalRequest?.url ?? '');

    if (status === 401 && !isAuthCall && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) return enqueueRequest(originalRequest);

      isRefreshing = true;

      try {
        await auth.refresh();
        processQueue();
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export default api;
