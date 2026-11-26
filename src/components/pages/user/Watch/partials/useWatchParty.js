import React from 'react'
import party, { serverNow } from '../../../../../services/party.services'

const KEEP_CHAT = 100;
const VERBS = { play: 'reanudó la reproducción', pause: 'pausó', seek: 'saltó a otro punto' };

// ─── useWatchParty ────────────────────────────────────────────────────────────

// Estado de la sala de "ver juntos" a la que apunta ?party=CODIGO. Vive en WatchPage (no en el
// reproductor): el reproductor se desmonta al cambiar de episodio, pero la sala debe seguir.
//
//   latest      ref con el estado compartido { playing, position, at }; `at` es hora del servidor
//   subscribe   avisa de cada cambio que llega de otro miembro
//   control     comunica play / pause / seek propios
//   onEpisode   el anfitrion cambio de episodio (o la sala va por otro): hay que navegar
const useWatchParty = ({ code, malId, number, onEpisode }) => {

  const [status, setStatus] = React.useState(code ? 'connecting' : 'idle');   // idle | connecting | joined | error
  const [error, setError] = React.useState(null);
  const [room, setRoom] = React.useState(null);        // { hostId, members: [{ id, username }] }
  const [youId, setYouId] = React.useState(null);
  const [chat, setChat] = React.useState([]);
  const [activity, setActivity] = React.useState(null);

  const latest = React.useRef(null);
  const listeners = React.useRef(new Set());

  // Siempre los valores actuales, sin reiniciar la conexion cuando cambian.
  const current = React.useRef({});
  current.current = { malId: Number(malId), number: Number(number), onEpisode };

  React.useEffect(() => {
    latest.current = null;
    setRoom(null);
    setChat([]);
    setError(null);
    setStatus(code ? 'connecting' : 'idle');

    if (!code) return;

    const socket = party.socket();
    let alive = true;

    const join = async () => {
      await party.syncClock();
      const res = await party.join(code);

      if (!alive) return;

      if (!res?.ok) {
        setError(res?.error ?? 'No se pudo entrar en la sala');
        setStatus('error');
        return;
      }

      const { room: snap } = res;

      latest.current = { playing: snap.playing, position: snap.position, at: snap.at };
      setYouId(res.you);
      setRoom({ hostId: snap.hostId, members: snap.members });
      setChat(snap.chat ?? []);
      setError(null);
      setStatus('joined');

      // El enlace puede ser de un episodio anterior: la sala manda.
      if (snap.malId !== current.current.malId || snap.number !== current.current.number) {
        current.current.onEpisode?.({ malId: snap.malId, number: snap.number });
      }
    };

    const onMembers = (data) => setRoom({ hostId: data.hostId, members: data.members });
    const onChat = (message) => setChat((list) => [...list.filter((item) => item.id !== message.id), message].slice(-KEEP_CHAT));

    const onState = (state) => {
      latest.current = { playing: state.playing, position: state.position, at: state.at };
      setActivity({ id: Date.now(), text: `${state.by} ${VERBS[state.type] ?? 'cambió la reproducción'}` });
      listeners.current.forEach((listener) => listener(state));
    };

    const onEpisodeChange = (data) => {
      latest.current = { playing: false, position: 0, at: serverNow() };
      current.current.onEpisode?.(data);
    };

    const onDisconnect = () => alive && setStatus('connecting');

    socket.on('connect', join);   // tambien al reconectar tras un corte: pide la foto de la sala otra vez
    socket.on('disconnect', onDisconnect);
    socket.on('party:members', onMembers);
    socket.on('party:chat', onChat);
    socket.on('party:state', onState);
    socket.on('party:episode', onEpisodeChange);

    if (socket.connected) join();

    return () => {
      alive = false;
      socket.off('connect', join);
      socket.off('disconnect', onDisconnect);
      socket.off('party:members', onMembers);
      socket.off('party:chat', onChat);
      socket.off('party:state', onState);
      socket.off('party:episode', onEpisodeChange);

      // Si el aviso no llega, el servidor lo da por salido a los pocos segundos.
      socket.emit('party:leave');
      party.close();
    };
  }, [code]);

  const subscribe = React.useCallback((listener) => {
    listeners.current.add(listener);
    return () => listeners.current.delete(listener);
  }, []);

  // Lo propio se aplica primero en local: sin eso, el bucle que corrige desfases veria un estado
  // viejo y desharía la accion.
  const control = React.useCallback((type, position) => {
    const before = latest.current;
    latest.current = {
      playing: type === 'seek' ? Boolean(before?.playing) : type === 'play',
      position,
      at: serverNow(),
    };

    return party.control(type, position);
  }, []);

  const changeEpisode = React.useCallback((nextMalId, nextNumber) => {
    latest.current = { playing: false, position: 0, at: serverNow() };
    return party.episode(nextMalId, nextNumber);
  }, []);

  return {
    active: Boolean(code),
    code,
    status,
    error,
    room,
    chat,
    activity,
    youId,
    isHost: Boolean(room) && room.hostId === youId,
    latest,
    subscribe,
    serverNow,
    control,
    changeEpisode,
    send: party.chat,
    create: () => party.create(current.current.malId, current.current.number),
  };
};

export default useWatchParty
