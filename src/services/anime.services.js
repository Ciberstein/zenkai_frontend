import { API_ROUTES } from "../api/routes";
import api from "../api/axios";

// Ficha completa de un titulo sin pasar por el store: el hero la pide por
// adelantado para varios titulos a la vez y no debe pisar el `anime` global
// de la pagina de detalle. Se guarda lo ya resuelto para no repetir llamadas.
const cache = new Map();

const detail = (malId) => {
  if (!cache.has(malId)) {
    cache.set(
      malId,
      api.get(`${API_ROUTES.PUBLIC}/anime/${malId}`)
        .then((res) => res.data)
        .catch(() => {
          cache.delete(malId);
          return null;
        }),
    );
  }

  return cache.get(malId);
};

const anime = { detail };

export default anime;
