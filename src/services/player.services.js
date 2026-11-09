import { API_ROUTES } from "../api/routes";
import api from "../api/axios";

// El reproductor reporta avance cada 15s y al pausar/salir. Los fallos se
// ignoran a proposito: perder un ping de progreso no debe romper la sesion
// de visionado ni mostrar un error al usuario.
const progress = async ({ episodeId, progress: seconds, duration }) => {
  const url = `${API_ROUTES.USER}/history/progress`;
  return await api
    .post(url, { episodeId, progress: Math.floor(seconds), duration: Math.floor(duration ?? 0) })
    .catch(() => null);
};

const player = { progress };

export default player;
