import React from 'react'
import clsx from 'clsx'
import { useSelector } from 'react-redux'
import Icon from '../../../../shared/Icon'
import PlayerTopBar from './PlayerTopBar'
import ShortcutsGuide from './ShortcutsGuide'
import { captionCss, formatTime, readCaptionStyle, readPrefs, savePref, sourceLabel } from '../../../../../utils/player.util'

// ─── Constantes ───────────────────────────────────────────────────────────────

const IDLE_MS = 2800;          // sin actividad, los controles se ocultan
const SKIP = 10;               // segundos de los botones y del doble toque
const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];
const NEXT_PROMPT_SECONDS = 90;  // el aviso del siguiente episodio sale en el ultimo minuto y medio
const NEXT_MIN_LENGTH = 180;     // y solo en videos de mas de 3 minutos

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

// Boton que ofrece cada tipo de segmento. En los creditos, si hay episodio siguiente, el boton
// es el de pasar a el.
const SKIP_LABEL = { intro: 'Saltar intro', recap: 'Saltar resumen', outro: 'Saltar créditos' };
const AUTO_SKIP_MAX_IN = 1.5;    // la salto sola solo si la reproduccion llega al inicio del tramo, no si se entra a mitad

// ─── Piezas ───────────────────────────────────────────────────────────────────

export const IconButton = ({ label, active = false, box = 'size-10', className = '', children, ...props }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className={clsx(
      'grid shrink-0 cursor-pointer touch-manipulation place-items-center rounded-full transition-colors',
      'hover:bg-white/12 hover:text-accent disabled:pointer-events-none disabled:opacity-35',
      active ? 'text-accent' : 'text-white/90',
      box,
      className,
    )}
    {...props}
  >
    {children}
  </button>
)

// Una seccion sin nada que elegir no se pinta: quien la usa pasa [] en ese caso.
export const Section = ({ title, items, value, onSelect, scroll = false }) => {
  if (!items.length) return null;

  return (
    <div className="flex flex-col py-2">
      <p className="px-3 pb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">{title}</p>

      <div className={clsx('flex flex-col', scroll && 'max-h-52 overflow-y-auto overscroll-contain')}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onSelect(item.key)}
          className={clsx(
            'flex cursor-pointer items-center gap-2 px-3 py-1 text-left text-sm transition-colors hover:bg-white/10',
            value === item.key ? 'text-accent' : 'text-white/85',
          )}
        >
          <span className="grid size-4 shrink-0 place-items-center">
            {value === item.key && <Icon name="check" className="size-4" />}
          </span>
          {item.label}
        </button>
      ))}
      </div>
    </div>
  )
}

// ─── PlayerControls ───────────────────────────────────────────────────────────

// Interfaz propia del reproductor, en lugar de los controles del navegador. Es solo
// la capa de encima: el video, las pistas y el progreso viven en Player.jsx; aqui se
// escucha al <video> y se le dan ordenes.
//
//   · clic = pausa, doble clic = pantalla completa; en tactil, un toque muestra u oculta
//     y el doble toque en los lados salta 10 s
//   · barra de progreso con tiempo al pasar el cursor y arrastre
//   · atajos: espacio/k, j/l, ←/→, ↑/↓, m, f, c y 0-9
//   · se oculta sola a los pocos segundos mientras se reproduce
//   · los subtitulos de los .vtt se dibujan aqui (suben cuando aparece la barra)
const PlayerControls = ({
  video, wrapper, mediaKey,
  seriesTitle, episodeLabel, onClose,
  audio, levels, captions, caption,
  onAudio, onLevel, onCaption,
  onPrev, onNext,
  segments = [],
  sources = [], source = null, onSource = () => {},
}) => {

  const [playing, setPlaying] = React.useState(false);
  const [waiting, setWaiting] = React.useState(true);
  const [ended, setEnded] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const [buffered, setBuffered] = React.useState(0);
  const [volume, setVolume] = React.useState(1);
  const [muted, setMuted] = React.useState(false);
  const [rate, setRate] = React.useState(1);
  const [fs, setFs] = React.useState(false);
  const [pip, setPip] = React.useState(false);
  const [idle, setIdle] = React.useState(false);
  const [menu, setMenu] = React.useState(null);        // null | 'tracks' | 'settings'
  const [help, setHelp] = React.useState(false);        // guia de atajos abierta
  const [hover, setHover] = React.useState(null);      // fraccion bajo el cursor
  const [scrub, setScrub] = React.useState(null);      // fraccion mientras se arrastra
  const [toast, setToast] = React.useState(null);      // { text, side }
  const [cue, setCue] = React.useState([]);            // lineas del subtitulo activo
  const savedCaptions = useSelector((state) => state.account?.profile?.preferences?.subtitles);
  const captionStyle = React.useMemo(() => readCaptionStyle(savedCaptions), [savedCaptions]);   // el aspecto elegido en Ajustes
  const [stageHeight, setStageHeight] = React.useState(400);
  const [nearEnd, setNearEnd] = React.useState(false);
  const [active, setActive] = React.useState(null);    // segmento (intro/outro/recap) en curso
  const [autoSkip, setAutoSkip] = React.useState(() => readPrefs().autoSkip === true);

  const track = React.useRef(null);
  const fill = React.useRef(null);
  const thumb = React.useRef(null);
  const clock = React.useRef(null);
  const remaining = React.useRef(null);
  const scrubbing = React.useRef(null);
  const overBar = React.useRef(false);
  const idleTimer = React.useRef(null);
  const toastTimer = React.useRef(null);
  const lastTap = React.useRef(0);
  const pointerType = React.useRef('mouse');
  const lastCaption = React.useRef(null);
  const nearRef = React.useRef(false);
  const segmentsRef = React.useRef(segments);
  const activeRef = React.useRef(null);
  const autoRef = React.useRef(autoSkip);
  const autoDone = React.useRef(new Set());
  segmentsRef.current = segments;
  autoRef.current = autoSkip;
  const visibleRef = React.useRef(true);   // si los controles se veian justo antes del toque
  const wasVisible = React.useRef(true);

  const visible = !idle || !playing || menu !== null || scrub !== null;

  React.useEffect(() => { visibleRef.current = visible; });

  // ── Progreso (se pinta sin pasar por React: 60 renders por segundo sobran) ──

  const paint = React.useCallback(() => {
    const node = video.current;
    if (!node) return;

    const total = Number.isFinite(node.duration) ? node.duration : 0;
    const fraction = scrubbing.current ?? (total ? node.currentTime / total : 0);
    const pct = `${clamp(fraction, 0, 1) * 100}%`;

    if (fill.current) fill.current.style.width = pct;
    if (thumb.current) thumb.current.style.left = pct;

    // Transcurrido a la izquierda de la barra y lo que falta a la derecha.
    const seconds = scrubbing.current !== null ? scrubbing.current * total : node.currentTime;
    if (clock.current) clock.current.textContent = formatTime(seconds);
    if (remaining.current) remaining.current.textContent = `−${formatTime(Math.max(0, total - seconds))}`;

    // En los ultimos segundos (creditos) aparece el boton de "Siguiente episodio".
    const near = total > NEXT_MIN_LENGTH && total - node.currentTime <= NEXT_PROMPT_SECONDS;
    if (near !== nearRef.current) { nearRef.current = near; setNearEnd(near); }

    // Segmento en curso: el boton "Saltar" vive mientras dure (menos su ultimo instante).
    const now = node.currentTime;
    const segment = segmentsRef.current.find((item) => now >= item.start && now < item.end - 0.5) ?? null;

    if ((segment?.type ?? null) !== (activeRef.current?.type ?? null)) { activeRef.current = segment; setActive(segment); }

    // Con "saltar automaticamente" la intro y el resumen se saltan solos, una vez por episodio.
    if (segment && segment.type !== 'outro' && autoRef.current && scrubbing.current === null
      && now - segment.start < AUTO_SKIP_MAX_IN && !autoDone.current.has(segment.type)) {
      autoDone.current.add(segment.type);
      node.currentTime = segment.end;
    }
  }, [video]);

  // Otro episodio: los tramos y lo ya saltado empiezan de cero.
  React.useEffect(() => {
    autoDone.current = new Set();
    activeRef.current = null;
    setActive(null);
  }, [mediaKey]);

  const skipSegment = React.useCallback(() => {
    const node = video.current;
    if (!node || !activeRef.current) return;

    const { end } = activeRef.current;
    node.currentTime = Number.isFinite(node.duration) ? Math.min(end, node.duration) : end;
  }, [video]);

  const toggleAutoSkip = () => {
    const next = !autoSkip;
    setAutoSkip(next);
    savePref('autoSkip', next);
  };

  // ── Escucha del <video> ────────────────────────────────────────────────────

  React.useEffect(() => {
    const node = video.current;
    if (!node) return;

    const sync = () => {
      setPlaying(!node.paused && !node.ended);
      setEnded(node.ended);
      setDuration(Number.isFinite(node.duration) ? node.duration : 0);
      setVolume(node.volume);
      setMuted(node.muted);
      setRate(node.playbackRate);
      paint();
    };

    const buffer = () => {
      const ranges = node.buffered;
      setBuffered(node.duration && ranges.length ? ranges.end(ranges.length - 1) / node.duration : 0);
    };

    const events = {
      play: sync, pause: sync, ended: sync, durationchange: sync, loadedmetadata: sync, volumechange: sync, ratechange: sync,
      playing: () => { setWaiting(false); sync(); },
      canplay: () => setWaiting(false),
      loadeddata: () => setWaiting(false),
      waiting: () => setWaiting(true),
      seeked: () => { setWaiting(false); paint(); buffer(); },
      timeupdate: () => { paint(); buffer(); },
      progress: buffer,
    };

    // El volumen elegido la ultima vez.
    const prefs = readPrefs();
    if (typeof prefs.volume === 'number') node.volume = clamp(prefs.volume, 0, 1);
    if (typeof prefs.muted === 'boolean') node.muted = prefs.muted;

    for (const [name, handler] of Object.entries(events)) node.addEventListener(name, handler);

    setWaiting(node.readyState < 3);
    sync();

    return () => { for (const [name, handler] of Object.entries(events)) node.removeEventListener(name, handler); };
  }, [video, mediaKey, paint]);

  // Mientras suena, la barra se mueve a cada fotograma.
  React.useEffect(() => {
    if (!playing) return;

    let frame;
    const tick = () => { paint(); frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [playing, paint]);

  // ── Subtitulos propios ─────────────────────────────────────────────────────

  // El texto de la pista elegida (los .vtt del episodio) se dibuja aqui y no con
  // los subtitulos del navegador, para poder subirlos cuando aparece la barra.
  React.useEffect(() => {
    const node = video.current;
    setCue([]);

    if (!node || !caption?.startsWith('db:')) return;

    const active = [...node.textTracks].find((item) => item.id === `zk-${caption.slice(3)}`);
    if (!active) return;

    // El texto de un .vtt llega con las entidades escapadas (&amp;, &lt;…): se muestran como texto.
    const ENTITIES = { amp: '&', lt: '<', gt: '>', nbsp: ' ', lrm: '', rlm: '' };
    const plain = (text) => text.replace(/<[^>]+>/g, '').replace(/&(amp|lt|gt|nbsp|lrm|rlm);/g, (_, name) => ENTITIES[name]);
    const read = () => setCue([...(active.activeCues ?? [])].map((item) => plain(item.text)));

    active.addEventListener('cuechange', read);
    read();

    return () => active.removeEventListener('cuechange', read);
  }, [video, mediaKey, caption]);

  // ── Autoocultado ───────────────────────────────────────────────────────────

  const poke = React.useCallback(() => {
    setIdle(false);
    clearTimeout(idleTimer.current);

    idleTimer.current = setTimeout(() => {
      // Con el cursor sobre la barra no se esconde.
      if (overBar.current) poke();
      else setIdle(true);
    }, IDLE_MS);
  }, []);

  React.useEffect(() => {
    const el = wrapper.current;
    if (!el) return;

    // Si nada tiene el foco (el cuerpo de la pagina), lo coge el reproductor: asi los
    // atajos funcionan sin tener que hacer clic antes. No se le quita a un campo de texto.
    const claimFocus = () => {
      if (!document.activeElement || document.activeElement === document.body) el.focus({ preventScroll: true });
    };

    const onDown = () => {
      wasVisible.current = visibleRef.current;
      poke();
    };

    el.addEventListener('pointermove', poke);
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointerenter', claimFocus);

    return () => {
      el.removeEventListener('pointermove', poke);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerenter', claimFocus);
      clearTimeout(idleTimer.current);
    };
  }, [wrapper, poke]);

  React.useEffect(() => { poke(); }, [playing, poke]);

  // El menu no puede ser mas alto que el propio reproductor (en pantallas bajas se desplaza).
  React.useEffect(() => {
    const el = wrapper.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => setStageHeight(el.clientHeight));
    observer.observe(el);
    setStageHeight(el.clientHeight);

    return () => observer.disconnect();
  }, [wrapper]);
  React.useEffect(() => () => clearTimeout(toastTimer.current), []);

  // ── Acciones ───────────────────────────────────────────────────────────────

  const announce = (text, side = 'center') => {
    setToast({ text, side, key: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 700);
  };

  const togglePlay = () => {
    const node = video.current;
    if (!node) return;

    if (node.ended) node.currentTime = 0;

    if (node.paused || node.ended) node.play().catch(() => {});
    else node.pause();
  };

  const seekTo = (seconds) => {
    const node = video.current;
    if (!node || !Number.isFinite(node.duration)) return;

    node.currentTime = clamp(seconds, 0, node.duration);
    paint();
  };

  const skip = (delta) => {
    seekTo((video.current?.currentTime ?? 0) + delta);
    announce(`${delta > 0 ? '+' : '−'}${Math.abs(delta)} s`, delta > 0 ? 'right' : 'left');
  };

  const changeVolume = (value) => {
    const node = video.current;
    if (!node) return;

    const next = clamp(value, 0, 1);
    node.volume = next;
    node.muted = next === 0;
    savePref('volume', next);
    savePref('muted', next === 0);
  };

  const toggleMute = () => {
    const node = video.current;
    if (!node) return;

    node.muted = !node.muted;
    if (!node.muted && node.volume === 0) node.volume = 0.5;
    savePref('muted', node.muted);
  };

  const toggleFullscreen = () => {
    // El marco de la página y no el propio reproductor: al pasar al siguiente episodio el
    // reproductor se desmonta, y lo que estuviera a pantalla completa saldría de ella.
    const el = wrapper.current?.closest('[data-player-stage]') ?? wrapper.current;
    const node = video.current;

    if (document.fullscreenElement || document.webkitFullscreenElement) {
      Promise.resolve((document.exitFullscreen ?? document.webkitExitFullscreen)?.call(document)).catch(() => {});
    } else if (el?.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    } else if (el?.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    } else {
      // iPhone: solo deja poner a pantalla completa el propio <video>.
      node?.webkitEnterFullscreen?.();
    }
  };

  // Pantalla sobre pantalla: el video sale a una ventana flotante. Solo donde el navegador lo ofrece.
  const canPip = typeof document !== 'undefined' && Boolean(document.pictureInPictureEnabled);

  const togglePip = () => {
    const node = video.current;
    if (!canPip || !node) return;

    if (document.pictureInPictureElement) document.exitPictureInPicture().catch(() => {});
    else node.requestPictureInPicture().catch(() => {});
  };

  // Lo que hace el boton de saltar: pasar al siguiente episodio en los creditos, o saltar el tramo.
  const activate = () => (active?.type === 'outro' && onNext ? onNext() : skipSegment());

  const cycleAudio = () => {
    const tracks = audio.tracks;
    const next = tracks[(tracks.findIndex((track) => track.key === audio.current) + 1) % tracks.length];

    onAudio(next.key);
    announce(`Audio: ${next.label}`);
  };

  const stepSpeed = (direction) => {
    const index = RATES.indexOf(rate);
    const next = RATES[clamp((index < 0 ? RATES.indexOf(1) : index) + direction, 0, RATES.length - 1)];

    setSpeed(next);
    announce(`Velocidad ${next}×`);
  };

  const toggleCaptions = () => {
    if (caption !== 'off') {
      lastCaption.current = caption;
      onCaption('off');
      announce('Subtítulos desactivados');
      return;
    }

    const next = lastCaption.current ?? captions.find((item) => item.key !== 'off')?.key;
    if (next) { onCaption(next); announce('Subtítulos activados'); }
  };

  const setSpeed = (value) => {
    if (video.current) video.current.playbackRate = value;
  };

  React.useEffect(() => {
    const onChange = () => setFs(Boolean(document.fullscreenElement ?? document.webkitFullscreenElement));

    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);

    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  React.useEffect(() => {
    const node = video.current;
    if (!node) return;

    const enter = () => setPip(true);
    const leave = () => setPip(false);

    node.addEventListener('enterpictureinpicture', enter);
    node.addEventListener('leavepictureinpicture', leave);

    return () => {
      node.removeEventListener('enterpictureinpicture', enter);
      node.removeEventListener('leavepictureinpicture', leave);
    };
  }, []);

  // ── Teclado ────────────────────────────────────────────────────────────────

  React.useEffect(() => {
    const el = wrapper.current;
    if (!el) return;

    const onKey = (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;

      // Con la guia abierta solo se atienden Esc y ? (cerrarla); el resto no debe tocar el video.
      if (help) {
        if (event.key === 'Escape' || event.key === '?') { setHelp(false); event.preventDefault(); }
        return;
      }

      const target = event.target;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) return;

      // Espacio o Intro sobre un boton lo activan a el, no al video.
      const onButton = Boolean(target.closest?.('button'));
      const node = video.current;
      let handled = true;

      switch (event.key) {
        case ' ': if (onButton) { handled = false; break; } togglePlay(); break;
        case 'k': togglePlay(); break;
        case 'ArrowLeft': skip(-5); break;
        case 'ArrowRight': skip(5); break;
        case 'j': skip(-SKIP); break;
        case 'l': skip(SKIP); break;
        case 'ArrowUp': changeVolume((node?.muted ? 0 : node?.volume ?? 1) + 0.05); announce(`Volumen ${Math.round(clamp((node?.volume ?? 1) + 0.05, 0, 1) * 100)}%`); break;
        case 'ArrowDown': changeVolume((node?.volume ?? 1) - 0.05); announce(`Volumen ${Math.round(clamp((node?.volume ?? 1) - 0.05, 0, 1) * 100)}%`); break;
        case 'm': toggleMute(); break;
        case 'f': toggleFullscreen(); break;
        case 'i': if (canPip) togglePip(); else handled = false; break;
        case 'c': toggleCaptions(); break;
        case 'a': if (audio.tracks.length > 1) cycleAudio(); else handled = false; break;
        case 's': if (active) activate(); else handled = false; break;
        case 'o': toggleAutoSkip(); announce(autoSkip ? 'Salto automático desactivado' : 'Salto automático activado'); break;
        case '<': stepSpeed(-1); break;
        case '>': stepSpeed(1); break;
        case 'Home': seekTo(0); break;
        case 'End': if (node && Number.isFinite(node.duration)) seekTo(node.duration); else handled = false; break;
        case 'n': if (onNext) onNext(); else handled = false; break;
        case 'p': if (onPrev) onPrev(); else handled = false; break;
        case '?': setHelp(true); setMenu(null); break;
        case 'Escape': if (menu) setMenu(null); else handled = false; break;
        default:
          if (/^[0-9]$/.test(event.key) && node && Number.isFinite(node.duration)) seekTo((Number(event.key) / 10) * node.duration);
          else handled = false;
      }

      if (handled) { event.preventDefault(); poke(); }
    };

    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  });

  // ── Barra de progreso ──────────────────────────────────────────────────────

  const fractionAt = (clientX) => {
    const rect = track.current.getBoundingClientRect();
    return clamp((clientX - rect.left) / rect.width, 0, 1);
  };

  const onSeekDown = (event) => {
    if (!duration) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    const fraction = fractionAt(event.clientX);

    scrubbing.current = fraction;
    setScrub(fraction);
    paint();
  };

  const onSeekMove = (event) => {
    const fraction = fractionAt(event.clientX);
    setHover(fraction);

    if (scrubbing.current !== null) {
      scrubbing.current = fraction;
      setScrub(fraction);
      paint();
    }
  };

  const onSeekUp = () => {
    if (scrubbing.current === null) return;

    const fraction = scrubbing.current;
    scrubbing.current = null;
    setScrub(null);
    seekTo(fraction * duration);
  };

  // ── Superficie: clic, doble clic y toques ──────────────────────────────────

  const onSurface = (event) => {
    wrapper.current?.focus({ preventScroll: true });

    if (menu) { setMenu(null); return; }
    if (help) { setHelp(false); return; }

    const now = Date.now();
    const touch = pointerType.current !== 'mouse';
    const rect = event.currentTarget.getBoundingClientRect();
    const zone = (event.clientX - rect.left) / rect.width;

    // Segundo toque en menos de 300 ms.
    if (now - lastTap.current < 300) {
      lastTap.current = 0;

      if (touch && zone < 0.33) skip(-SKIP);
      else if (touch && zone > 0.67) skip(SKIP);
      else {
        // Con raton el primer clic ya habia pausado o reanudado: se deshace.
        if (!touch) togglePlay();
        toggleFullscreen();
      }
      return;
    }

    lastTap.current = now;

    if (touch) {
      // Con los controles a la vista, un toque los oculta; si no, los muestra. Se mira
      // como estaban antes del toque: el propio toque ya los habia despertado.
      if (wasVisible.current && playing) setIdle(true);
      else poke();
    } else {
      togglePlay();
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const shown = scrub ?? hover;
  const hasTracks = audio.tracks.length > 1 || captions.length > 1;
  const volumeIcon = muted || volume === 0 ? 'volume-mute' : volume < 0.5 ? 'volume-low' : 'volume';
  const volumeValue = muted ? 0 : volume;

  return (
    <div className={clsx('absolute inset-0 z-10 select-none overflow-hidden', !visible && playing && 'cursor-none')}>

      <div
        className="absolute inset-0"
        onPointerDown={(event) => { pointerType.current = event.pointerType; }}
        onClick={onSurface}
      />

      {/* Subtitulos: suben cuando aparece la barra para no quedar debajo */}
      <div
        className={clsx(
          'pointer-events-none absolute inset-x-0 flex flex-col items-center gap-1 px-[7%] text-center transition-[bottom] duration-300',
          visible ? 'bottom-32 sm:bottom-44' : 'bottom-6 sm:bottom-10',
        )}
      >
        {cue.map((line, index) => (
          <p
            key={`${index}-${line}`}
            style={captionCss(captionStyle)}
            className="max-w-full whitespace-pre-line px-3 py-0.5 font-semibold leading-snug [text-shadow:0_1px_2px_rgb(0_0_0/0.9)]"
          >
            {line}
          </p>
        ))}
      </div>

      {help && <ShortcutsGuide canPip={canPip} onClose={() => { setHelp(false); wrapper.current?.focus({ preventScroll: true }); }} />}

      {/* Cargando */}
      {waiting && !ended && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="size-12 animate-spin rounded-full border-2 border-white/20 border-t-accent" role="status" aria-label="Cargando" />
        </div>
      )}

      {/* Avisos: saltos, volumen, subtitulos */}
      {toast && (
        <div
          key={toast.key}
          className={clsx(
            'pointer-events-none absolute top-1/2 -translate-y-1/2 animate-fade-in',
            toast.side === 'left' && 'left-[12%]',
            toast.side === 'right' && 'right-[12%]',
            toast.side === 'center' && 'left-1/2 -translate-x-1/2',
          )}
        >
          <span className="bg-black/75 px-4 py-2 font-mono text-sm uppercase tracking-[0.14em] text-accent">{toast.text}</span>
        </div>
      )}

      {/* Cabecera: volver a la serie */}
      <PlayerTopBar seriesTitle={seriesTitle} episodeLabel={episodeLabel} onClose={onClose} visible={visible} />

      {/* Saltar intro / resumen / creditos: solo mientras dura el tramo */}
      {active && (
        <button
          type="button"
          onClick={activate}
          title="Saltar (s)"
          className={clsx(
            'cut cut-focus absolute right-4 z-10 flex cursor-pointer items-center gap-2 bg-white/15 px-5 py-3 font-display text-sm font-bold uppercase tracking-[0.08em] text-white backdrop-blur-md transition-[bottom,background-color,color] duration-300 hover:bg-accent hover:text-accent-fg sm:right-6',
            visible ? 'bottom-32 sm:bottom-44' : 'bottom-8',
          )}
        >
          {active.type === 'outro' && onNext ? 'Siguiente episodio' : SKIP_LABEL[active.type]}
          <Icon name="next" className="size-4" />
        </button>
      )}

      {/* Siguiente episodio, en los creditos */}
      {onNext && nearEnd && active?.type !== 'outro' && (
        <button
          type="button"
          onClick={onNext}
          title="Siguiente episodio (n)"
          className={clsx(
            'cut cut-focus absolute right-4 z-10 flex cursor-pointer items-center gap-2 bg-white/15 px-5 py-3 font-display text-sm font-bold uppercase tracking-[0.08em] text-white backdrop-blur-md transition-[bottom,background-color,color] duration-300 hover:bg-accent hover:text-accent-fg sm:right-6',
            visible ? 'bottom-32 sm:bottom-44' : 'bottom-8',
          )}
        >
          Siguiente episodio
          <Icon name="next" className="size-4" />
        </button>
      )}

      {/* Esquinas */}
      <div className={clsx('pointer-events-none absolute inset-0 transition-opacity duration-300', visible ? 'opacity-100' : 'opacity-0')}>
        <span className="absolute left-2 top-2 size-3 border-l-2 border-t-2 border-accent/70" />
        <span className="absolute right-2 top-2 size-3 border-r-2 border-t-2 border-accent/70" />
        <span className="absolute bottom-2 left-2 size-3 border-b-2 border-l-2 border-accent/70" />
        <span className="absolute bottom-2 right-2 size-3 border-b-2 border-r-2 border-accent/70" />
      </div>

      {/* Barra de controles */}
      <div
        onPointerEnter={() => { overBar.current = true; }}
        onPointerLeave={() => { overBar.current = false; }}
        className={clsx(
          'absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 via-black/55 to-transparent px-3 pb-3 pt-20 transition-[opacity,translate] duration-300 sm:px-6 sm:pb-6',
          !visible && 'pointer-events-none translate-y-2 opacity-0',
        )}
      >
        {/* Progreso: lo transcurrido a la izquierda de la barra y lo que falta a la derecha */}
        <div className="flex items-center gap-3 sm:gap-4">
          <span ref={clock} className="w-18 shrink-0 text-left font-mono text-base tabular-nums text-white/90 sm:w-22 sm:text-lg">0:00</span>

          <div
            ref={track}
            role="slider"
            tabIndex={0}
            aria-label="Progreso"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round((video.current?.currentTime ?? 0))}
            onPointerDown={onSeekDown}
            onPointerMove={onSeekMove}
            onPointerUp={onSeekUp}
            onPointerCancel={onSeekUp}
            onPointerLeave={() => setHover(null)}
            className="group/seek relative h-6 min-w-0 flex-1 cursor-pointer touch-none"
          >
            <div className="absolute inset-x-0 top-1/2 h-0.75 -translate-y-1/2 bg-white/20 transition-[height] duration-150 group-hover/seek:h-1.25">
              <div className="absolute inset-y-0 left-0 bg-white/30" style={{ width: `${buffered * 100}%` }} />
              {duration > 0 && segments.map((item) => (
                <div
                  key={item.type}
                  aria-hidden="true"
                  className="absolute inset-y-0 bg-accent/45"
                  style={{ left: `${(item.start / duration) * 100}%`, width: `${((item.end - item.start) / duration) * 100}%` }}
                />
              ))}
              <div ref={fill} className="absolute inset-y-0 left-0 bg-accent shadow-[0_0_10px_var(--accent)]" />
            </div>

            <span
              ref={thumb}
              className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 scale-0 bg-accent transition-transform duration-150 group-hover/seek:scale-100"
            />

            {shown !== null && duration > 0 && (
              <span
                className="pointer-events-none absolute bottom-full mb-2 -translate-x-1/2 bg-black/90 px-2 py-1 font-mono text-xs tabular-nums text-white"
                style={{ left: `clamp(28px, ${shown * 100}%, calc(100% - 28px))` }}
              >
                {formatTime(shown * duration)}
              </span>
            )}
          </div>

          <span ref={remaining} className="w-18 shrink-0 text-right font-mono text-base tabular-nums text-white/90 sm:w-22 sm:text-lg">−0:00</span>
        </div>

        {/* Botones: el transporte va centrado, con el play en medio */}
        <div className="relative mt-1.5 flex h-14 items-center justify-between sm:mt-4 sm:h-20">
          <div className="flex items-center">
            <div className="group/volume hidden items-center sm:flex">
              <IconButton box="size-12" label={muted ? 'Activar sonido (m)' : 'Silenciar (m)'} onClick={toggleMute}>
                <Icon name={volumeIcon} className="size-7" />
              </IconButton>

              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={volumeValue}
                aria-label="Volumen"
                onChange={(event) => changeVolume(Number(event.target.value))}
                style={{ '--v': `${volumeValue * 100}%` }}
                className="zk-range w-0 opacity-0 transition-[width,opacity,margin] duration-200 group-hover/volume:ml-1 group-hover/volume:mr-2 group-hover/volume:w-24 group-hover/volume:opacity-100 focus-visible:ml-1 focus-visible:mr-2 focus-visible:w-24 focus-visible:opacity-100"
              />
            </div>
          </div>

          <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-0.5 sm:gap-2">
            <IconButton box="size-10 sm:size-12" label="Episodio anterior (p)" onClick={onPrev ?? undefined} disabled={!onPrev}>
              <Icon name="previous" className="size-5 sm:size-6" />
            </IconButton>

            <IconButton box="size-12" label="Retroceder 10 s (j)" onClick={() => skip(-SKIP)} className="hidden sm:grid">
              <Icon name="rewind-10" className="size-8" />
            </IconButton>

            <IconButton box="size-14 sm:size-20" label={ended ? 'Ver de nuevo (k)' : playing ? 'Pausa (k)' : 'Reproducir (k)'} onClick={togglePlay}>
              <Icon name={playing ? 'pause' : 'play'} className="size-9 sm:size-14" />
            </IconButton>

            <IconButton box="size-12" label="Adelantar 10 s (l)" onClick={() => skip(SKIP)} className="hidden sm:grid">
              <Icon name="forward-10" className="size-8" />
            </IconButton>

            <IconButton box="size-10 sm:size-12" label="Siguiente episodio (n)" onClick={onNext ?? undefined} disabled={!onNext}>
              <Icon name="next" className="size-5 sm:size-6" />
            </IconButton>
          </div>

          <div className="flex items-center">
            {hasTracks && (
              <IconButton
                box="size-9 sm:size-12"
                label="Audio (a) y subtítulos (c)"
                active={menu === 'tracks'}
                aria-expanded={menu === 'tracks'}
                onClick={() => setMenu((current) => (current === 'tracks' ? null : 'tracks'))}
              >
                <Icon name="captions" className="size-5 sm:size-7" />
              </IconButton>
            )}

            <IconButton
              box="size-9 sm:size-12"
              label="Ajustes: velocidad (< >) y salto automático (o)"
              active={menu === 'settings'}
              aria-expanded={menu === 'settings'}
              onClick={() => setMenu((current) => (current === 'settings' ? null : 'settings'))}
            >
              <Icon name="settings" className="size-5 sm:size-7" />
            </IconButton>

            {canPip && (
              <IconButton box="size-9 sm:size-12" label={pip ? 'Salir de pantalla sobre pantalla (i)' : 'Pantalla sobre pantalla (i)'} active={pip} onClick={togglePip}>
                <Icon name="pip" className="size-5 sm:size-7" />
              </IconButton>
            )}

            <IconButton box="size-9 sm:size-12" label={fs ?'Salir de pantalla completa (f)' : 'Pantalla completa (f)'} onClick={toggleFullscreen}>
              <Icon name={fs ? 'fullscreen-exit' : 'fullscreen'} className="size-5 sm:size-7" />
            </IconButton>
          </div>

          {menu && (
            <div
              style={{ maxHeight: `min(${Math.max(140, stageHeight - 120)}px, 70vh)` }}
              className="absolute bottom-full right-0 mb-8 w-60 divide-y sm:mb-12 divide-white/10 overflow-y-auto bg-black/92 text-white backdrop-blur-md"
            >
              {menu === 'tracks' && (
                <>
                  <Section title="Audio" items={audio.tracks.length > 1 ? audio.tracks : []} value={audio.current} onSelect={onAudio} />
                  <Section title="Subtítulos" items={captions.length > 1 ? captions : []} value={caption} onSelect={onCaption} scroll />
                </>
              )}

              {menu === 'settings' && (
                <>
                  <Section
                    title="Servidor"
                    items={sources.length > 1 ? sources.map((item) => ({ key: String(item.id), label: sourceLabel(item) })) : []}
                    value={String(source?.id)}
                    onSelect={(key) => onSource(sources.find((item) => String(item.id) === key))}
                  />
                  <Section
                    title="Calidad"
                    items={levels.list.length > 1 ? [{ key: '-1', label: 'Auto' }, ...levels.list] : []}
                    value={String(levels.current)}
                    onSelect={onLevel}
                  />
                  {segments.length > 0 && (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={autoSkip}
                      onClick={toggleAutoSkip}
                      className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-left text-sm text-white/85 transition-colors hover:bg-white/10"
                    >
                      Saltar intros automáticamente (o)
                      <span className={clsx('relative h-4 w-7 shrink-0 transition-colors', autoSkip ? 'bg-accent' : 'bg-white/25')}>
                        <span className={clsx('absolute top-0.5 size-3 bg-white transition-[left]', autoSkip ? 'left-3.5' : 'left-0.5')} />
                      </span>
                    </button>
                  )}

                  <div className="flex flex-col gap-2 px-3 py-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Velocidad ( &lt; &gt; )</p>

                    <div className="flex flex-wrap gap-1.5">
                      {RATES.map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setSpeed(value)}
                          className={clsx(
                            'cursor-pointer px-2.5 py-1 font-mono text-xs tabular-nums transition-colors',
                            rate === value ? 'bg-accent text-accent-fg' : 'bg-white/10 text-white/85 hover:bg-white/20',
                          )}
                        >
                          {value}×
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setMenu(null); setHelp(true); }}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-left text-sm text-white/85 transition-colors hover:bg-white/10"
                  >
                    Atajos de teclado
                    <kbd className="border border-white/25 bg-white/10 px-1.5 font-mono text-xs">?</kbd>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PlayerControls
