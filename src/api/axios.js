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

    if (status === 401 && !originalRequest._retry) {
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
