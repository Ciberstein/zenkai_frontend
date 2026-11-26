import { io } from 'socket.io-client'
import auth from './auth.services'

// Ver juntos: conexion WebSocket con la API. Una sola para toda la app: se abre al entrar en una
// sala y se cierra al salir. La sesion viaja en la cookie, igual que en las peticiones HTTP.

let socket = null;
let refreshed = false;

// Diferencia entre el reloj del servidor y el de este equipo (ms). Todos los tiempos de la sala son
// del servidor: asi dos equipos con la hora mal puesta siguen sincronizados.
let offset = 0;

export const serverNow = () => Date.now() + offset;

const open = () => {
  if (socket) return socket;

  socket = io(import.meta.env.VITE_API_URL || undefined, { withCredentials: true });

  // Con el token de acceso caducado el servidor rechaza la conexion: se renueva la sesion una vez y se reintenta.
  socket.on('connect_error', async (err) => {
    if (err.message !== 'unauthorized' || refreshed) return;

    refreshed = true;
    await auth.refresh();
    socket.connect();
  });

  socket.on('connect', () => { refreshed = false; });

  return socket;
};

// Emite un evento y espera el ack del servidor (o falla a los 5 s).
const call = (event, data = {}) => new Promise((resolve) => {
  open().timeout(5000).emit(event, data, (err, response) => resolve(err ? { ok: false, error: 'El servidor no responde' } : response));
});

// Mide el desfase de reloj con 3 muestras y se queda con la de menor latencia.
const syncClock = async () => {
  let best = null;

  for (let i = 0; i < 3; i += 1) {
    const sent = Date.now();
    const res = await call('party:time');
    const received = Date.now();

    if (!res?.serverTime) continue;

    const rtt = received - sent;
    if (!best || rtt < best.rtt) best = { rtt, offset: res.serverTime - (sent + received) / 2 };
  }

  if (best) offset = best.offset;
};

const party = {
  socket: open,
  syncClock,
  create: (malId, number) => call('party:create', { malId, number }),
  join: (code) => call('party:join', { code }),
  leave: () => call('party:leave'),
  control: (type, position) => call('party:control', { type, position }),
  episode: (malId, number) => call('party:episode', { malId, number }),
  chat: (text) => call('party:chat', { text }),

  // Cierra la conexion (al dejar de ver en grupo).
  close: () => { socket?.disconnect(); socket = null; refreshed = false; },
};

export default party
