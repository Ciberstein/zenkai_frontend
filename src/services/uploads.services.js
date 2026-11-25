import { API_ROUTES } from '../api/routes'
import api from '../api/axios'

const base = `${API_ROUTES.ADMIN}/anime`;

// Subida directa al bucket con la URL firmada que da la API. Se usa XMLHttpRequest
// y no fetch porque fetch todavia no informa del progreso de subida. `body` es el archivo
// entero o un trozo de el (una parte de una subida grande).
const send = (url, body, name, onProgress = () => {}) => new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();

  xhr.open('PUT', url);
  xhr.upload.onprogress = (event) => event.lengthComputable && onProgress(event.loaded);

  xhr.onload = () => (xhr.status >= 200 && xhr.status < 300
    ? resolve()
    : reject(new Error(`El almacenamiento rechazó "${name}" (${xhr.status})`)));

  xhr.onerror = () => reject(new Error(
    `No se pudo subir "${name}". Revisa que el bucket de subidas permita PUT desde esta web (CORS) y que haya conexión.`,
  ));

  xhr.send(body);
});

const PARALLEL = 4;
const RETRIES = 3;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Subida en partes de un archivo grande: la API da una URL firmada por parte. Se envian de a
// `PARALLEL` y cada una se reintenta sola si falla, sin repetir las que ya llegaron.
const sendParts = async (file, { parts, partSize }, onProgress) => {
  const loaded = new Array(parts.length).fill(0);
  const report = () => onProgress(loaded.reduce((sum, value) => sum + value, 0));
  let next = 0;
  let failed = null;

  const worker = async () => {
    while (next < parts.length && !failed) {
      const index = next;
      next += 1;

      const body = file.slice(index * partSize, (index + 1) * partSize);

      for (let attempt = 1; ; attempt += 1) {
        try {
          await send(parts[index], body, file.name, (value) => { loaded[index] = value; report(); });
          loaded[index] = body.size;
          report();
          break;
        } catch (err) {
          loaded[index] = 0;
          report();

          if (attempt >= RETRIES) { failed = err; return; }

          await wait(1000 * attempt);
        }
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(PARALLEL, parts.length) }, worker));

  if (failed) throw failed;
};

// `target` es un archivo de la respuesta de la API: { url } (subida simple) o { parts, partSize }.
const put = (target, file, onProgress = () => {}) => (
  target.parts ? sendParts(file, target, onProgress) : send(target.url, file, file.name, onProgress)
);

const uploads = {
  create: (episodeId, body) => api.post(`${base}/episodes/${episodeId}/uploads`, body).then((res) => res.data),
  complete: (id) => api.post(`${base}/uploads/${id}/complete`),
  retry: (id) => api.post(`${base}/uploads/${id}/retry`),
  remove: (id) => api.delete(`${base}/uploads/${id}`),

  // Subtitulos como archivo (.ass, .ssa, .srt o .vtt): el cuerpo son los bytes tal cual y los
  // datos van en la query. La API los convierte a WebVTT y los guarda en el bucket. Se envia
  // asi y no como texto para no estropear la codificacion de los .srt/.ass antiguos.
  subtitle: (episodeId, file, params) => api.post(
    `${base}/episodes/${episodeId}/subtitles/upload`,
    file,
    { params: { ...params, filename: file.name }, headers: { 'Content-Type': 'application/octet-stream' } },
  ).then((res) => res.data),

  // Editar una pista de subtitulos: { label?, language?, default? }.
  updateSubtitle: (id, body) => api.patch(`${base}/subtitles/${id}`, body).then((res) => res.data),

  // Otro audio (doblaje) para un episodio ya publicado: se sube el archivo y el worker lo suma.
  createAudio: (episodeId, body) => api.post(`${base}/episodes/${episodeId}/audio-uploads`, body).then((res) => res.data),
  // Audios que tiene publicado el episodio y quitar uno (p. ej. un doblaje de mas).
  audio: (episodeId) => api.get(`${base}/episodes/${episodeId}/audio`).then((res) => res.data),
  defaultAudio: (episodeId, dir) => api.put(`${base}/episodes/${episodeId}/audio/${dir}/default`).then((res) => res.data),
  renameAudio: (episodeId, dir, name, lang) => api.patch(`${base}/episodes/${episodeId}/audio/${dir}`, { name, ...(lang ? { lang } : {}) }).then((res) => res.data),
  removeAudio: (episodeId, dir) => api.delete(`${base}/episodes/${episodeId}/audio/${dir}`).then((res) => res.data),
  put,
};

export default uploads
