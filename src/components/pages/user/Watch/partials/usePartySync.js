import React from 'react'

const CHECK_MS = 3000;
const MAX_DRIFT = 1;       // s: mas desfase que esto con la reproduccion en marcha se corrige saltando

// ─── usePartySync ─────────────────────────────────────────────────────────────

// Ata el <video> al estado compartido de la sala (useWatchParty):
//   · lo que llega de otros (play, pausa, salto) se aplica al video
//   · lo que hace este usuario en el video se comunica a la sala
//   · cada pocos segundos se corrige el desfase acumulado (con un salto: acelerar o frenar cambiaria la
//     velocidad que muestra el menu del reproductor)
//
// Para no entrar en bucle (aplicar algo remoto provoca un evento del video que se volveria a emitir) los
// eventos del video solo se envian si DIFIEREN del estado de la sala: un play cuando la sala ya esta
// reproduciendo, o un seeked que cae donde la sala dice que deberia estar, no se comunican.
//
// Devuelve { blocked, resume }: el navegador puede negarse a reproducir sin que el usuario toque nada;
// entonces se pide un toque (resume) y se reproduce desde ese gesto.
const usePartySync = (party, video, mediaKey) => {

  const [blocked, setBlocked] = React.useState(false);

  const ref = React.useRef(party);
  ref.current = party;

  const active = party?.status === 'joined';
  const apply = React.useRef(() => {});

  React.useEffect(() => {
    const node = video.current;
    if (!active || !node) return;

    const shared = () => ref.current.latest.current;

    const expected = () => {
      const state = shared();
      if (!state) return null;

      return state.playing ? state.position + (ref.current.serverNow() - state.at) / 1000 : state.position;
    };

    const sync = () => {
      const state = shared();
      if (!state || node.readyState < 1) return;

      const target = expected();
      const diff = node.currentTime - target;

      if (state.playing && node.paused) node.play().then(() => setBlocked(false)).catch(() => setBlocked(true));
      else if (!state.playing && !node.paused) node.pause();

      if (node.seeking) return;

      // Sin datos suficientes (cargando) no se corrige: saltar mas solo alargaria la espera.
      const buffering = state.playing && node.readyState < 3 && node.currentTime > 1;

      if (!buffering && Math.abs(diff) > (state.playing ? MAX_DRIFT : 0.3)) {
        const end = Number.isFinite(node.duration) ? node.duration : target;
        node.currentTime = Math.max(0, Math.min(target, end));
      }
    };

    apply.current = sync;

    const onPlay = () => {
      const state = shared();
      if (state && !state.playing) ref.current.control('play', node.currentTime);
    };

    // El fin del video tambien dispara pause: no es una pausa de nadie.
    const onPause = () => {
      const state = shared();
      if (state?.playing && !node.ended) ref.current.control('pause', node.currentTime);
    };

    const onSeeked = () => {
      const target = expected();
      if (target !== null && Math.abs(node.currentTime - target) >= 1) ref.current.control('seek', node.currentTime);
    };

    node.addEventListener('play', onPlay);
    node.addEventListener('pause', onPause);
    node.addEventListener('seeked', onSeeked);
    node.addEventListener('loadedmetadata', sync);
    node.addEventListener('canplay', sync);

    const unsubscribe = ref.current.subscribe(sync);
    const timer = setInterval(sync, CHECK_MS);

    sync();

    return () => {
      node.removeEventListener('play', onPlay);
      node.removeEventListener('pause', onPause);
      node.removeEventListener('seeked', onSeeked);
      node.removeEventListener('loadedmetadata', sync);
      node.removeEventListener('canplay', sync);
      unsubscribe();
      clearInterval(timer);
      apply.current = () => {};
    };
  }, [active, video, mediaKey]);

  // Desde un toque del usuario el navegador deja reproducir.
  const resume = React.useCallback(() => {
    const node = video.current;
    setBlocked(false);

    if (node) node.play().catch(() => setBlocked(true));
    apply.current();
  }, [video]);

  return { blocked: active && blocked, resume };
};

export default usePartySync
