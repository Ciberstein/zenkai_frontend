import { API_ROUTES } from "../api/routes";
import api from "../api/axios";

// Tareas programadas del backend. No viven en el store: el panel las consulta
// por intervalos mientras alguna esta en curso y no las comparte con nadie mas.
const list = async () => {
  const res = await api.get(`${API_ROUTES.ADMIN}/jobs`);
  return res.data;
};

// Responde 202 en cuanto arranca; el avance se ve con `list`.
const run = async (name) => {
  return await api.post(`${API_ROUTES.ADMIN}/jobs/${encodeURIComponent(name)}/run`);
};

const jobs = { list, run };

export default jobs;
