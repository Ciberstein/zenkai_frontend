import { API_ROUTES } from '../api/routes'
import api from '../api/axios'

const base = `${API_ROUTES.ADMIN}/anime`;

// Subida directa al bucket con la URL firmada que da la API. Se usa XMLHttpRequest
// y no fetch porque fetch todavia no informa del progreso de subida.
const put = (url, file, onProgress = () => {}) => new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();

  xhr.open('PUT', url);
  xhr.upload.onprogress = (event) => event.lengthComputable && onProgress(event.loaded);

  xhr.onload = () => (xhr.status >= 200 && xhr.status < 300
    ? resolve()
    : reject(new Error(`El almacenamiento rechazó "${file.name}" (${xhr.status})`)));

  xhr.onerror = () => reject(new Error(
    `No se pudo subir "${file.name}". Revisa que el bucket de subidas permita PUT desde esta web (CORS) y que haya conexión.`,
  ));

  xhr.send(file);
});

const uploads = {
  create: (episodeId, body) => api.post(`${base}/episodes/${episodeId}/uploads`, body).then((res) => res.data),
  complete: (id) => api.post(`${base}/uploads/${id}/complete`),
  retry: (id) => api.post(`${base}/uploads/${id}/retry`),
  remove: (id) => api.delete(`${base}/uploads/${id}`),
  put,
};

export default uploads
