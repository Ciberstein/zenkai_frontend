import { API_ROUTES } from '../api/routes'
import api from '../api/axios'

const base = `${API_ROUTES.ADMIN}/anime`;

// Marcas de intro / créditos / resumen de un episodio. Las que pone un admin mandan sobre
// las de AniSkip, que solo rellenan lo que falta.
const segments = {
  set: (episodeId, type, body) => api.put(`${base}/episodes/${episodeId}/segments/${type}`, body).then((res) => res.data),
  remove: (episodeId, type) => api.delete(`${base}/episodes/${episodeId}/segments/${type}`).then((res) => res.data),
  // Busca en AniSkip: un episodio (responde con lo encontrado) o todo el anime (por detrás).
  search: (episodeId) => api.post(`${base}/episodes/${episodeId}/segments/fetch`).then((res) => res.data),
  searchAnime: (animeId) => api.post(`${base}/${animeId}/segments/fetch`).then((res) => res.data),
};

export default segments
