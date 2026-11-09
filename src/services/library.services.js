import { API_ROUTES } from "../api/routes";
import appError from "../utils/appError";
import api from "../api/axios";

// Escrituras puntuales que no viven en el store: el componente actualiza su
// estado local con la respuesta y el thunk correspondiente se refresca solo
// cuando el usuario entra a la pagina de la biblioteca.
const track = async (malId, status) => {
  const url = `${API_ROUTES.USER}/library/watchlist/${malId}`;
  return await api.post(url, { status }).catch((err) => appError(err));
};

const untrack = async (malId) => {
  const url = `${API_ROUTES.USER}/library/watchlist/${malId}`;
  return await api.delete(url).catch((err) => appError(err));
};

const favorite = async (malId) => {
  const url = `${API_ROUTES.USER}/library/favorites/${malId}`;
  return await api.post(url).catch((err) => appError(err));
};

const unfavorite = async (malId) => {
  const url = `${API_ROUTES.USER}/library/favorites/${malId}`;
  return await api.delete(url).catch((err) => appError(err));
};

const rate = async (malId, score) => {
  const url = `${API_ROUTES.USER}/library/ratings/${malId}`;
  return await api.post(url, { score }).catch((err) => appError(err));
};

const comment = async (malId, payload) => {
  const url = `${API_ROUTES.USER}/library/comments/${malId}`;
  return await api.post(url, payload).catch((err) => appError(err));
};

const library = { track, untrack, favorite, unfavorite, rate, comment };

export default library;
