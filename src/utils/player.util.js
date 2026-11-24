// Utilidades del reproductor: preferencias guardadas en el navegador, nombres de
// idioma y formato de tiempo. Viven aparte para que las compartan el reproductor
// (logica de video, pistas y subtitulos) y sus controles (interfaz).

const PREFS_KEY = 'zk_player_prefs';

// Lo que el usuario eligio la ultima vez (idioma de audio y de subtitulos, volumen):
// pasar de episodio no deberia obligarle a repetirlo.
export const readPrefs = () => {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY)) ?? {}; } catch { return {}; }
};

export const savePref = (key, value) => {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify({ ...readPrefs(), [key]: value })); } catch { /* sin storage */ }
};

// Olvida lo elegido a mano (p. ej. al cambiar el idioma del perfil, para que el nuevo se note).
export const clearPrefs = (keys) => {
  try {
    const prefs = readPrefs();
    for (const key of keys) delete prefs[key];
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch { /* sin storage */ }
};

// Posición en `list` de la pista del idioma pedido, o -1. Primero el idioma exacto ("es-419" con
// "es-419") y, si no hay, el mismo idioma base ("es" encuentra "es-419", y al revés).
export const matchLanguage = (list, code, langOf = (item) => item.lang) => {
  if (!code) return -1;

  const want = String(code).toLowerCase();
  const lang = (item) => String(langOf(item) ?? '').toLowerCase();

  const exact = list.findIndex((item) => lang(item) === want);
  if (exact >= 0) return exact;

  return list.findIndex((item) => lang(item).split('-')[0] === want.split('-')[0]);
};

// "ja" → "Japonés". Los manifiestos suelen traer nombres genericos ("audio_1")
// pero siempre el codigo de idioma, que es lo que de verdad dice que suena.
// Códigos que no son ISO pero se usan en la práctica: "lat" es español latino (para el navegador sería latín).
const ALIASES = { lat: 'Español latino' };

export const languageName = (code, fallback) => {
  if (ALIASES[String(code).toLowerCase()]) return ALIASES[String(code).toLowerCase()];

  try {
    const name = new Intl.DisplayNames(['es'], { type: 'language' }).of(code);
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return fallback;
  }
};

// "Wikimedia 480p · Subtitulado": como se nombra una fuente en los menus.
export const sourceLabel = (item) =>
  `${item.server}${item.quality && item.quality !== 'auto' ? ` ${item.quality}` : ''} · ${item.language === 'dub' ? 'Doblado' : 'Subtitulado'}`;

// 75 → "1:15", 3725 → "1:02:05"
export const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';

  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');

  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
};

// ─── Aspecto de los subtitulos ────────────────────────────────────────────────

// Fuentes que ya trae el dispositivo: no se descarga nada.
export const CAPTION_FONTS = [
  { value: 'default', label: 'Predeterminada', css: 'inherit' },
  { value: 'sans', label: 'Sans-serif', css: 'Arial, Helvetica, sans-serif' },
  { value: 'serif', label: 'Serif', css: 'Georgia, "Times New Roman", serif' },
  { value: 'mono', label: 'Monoespaciada', css: '"Courier New", Consolas, monospace' },
  { value: 'casual', label: 'Casual', css: '"Comic Sans MS", "Chalkboard SE", cursive' },
];

export const CAPTION_DEFAULTS = { size: 100, opacity: 60, color: '#ffffff', font: 'default' };   // % del tamaño · % de opacidad del fondo · color del texto · fuente

const within = (value, min, max, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(Math.max(number, min), max) : fallback;
};

// Apariencia de los subtitulos: manda lo guardado en el perfil (profile.preferences.subtitles) y, si
// aun no hay nada (cuentas anteriores a este ajuste), lo que quedo en este navegador. Cada valor se
// comprueba y, si no vale, se usa el de por defecto.
export const readCaptionStyle = (saved) => {
  const prefs = readPrefs();
  const from = saved ?? { size: prefs.captionSize, opacity: prefs.captionOpacity, color: prefs.captionColor, font: prefs.captionFont };

  return {
    size: within(from.size, 50, 200, CAPTION_DEFAULTS.size),
    opacity: within(from.opacity, 0, 100, CAPTION_DEFAULTS.opacity),
    font: CAPTION_FONTS.some((item) => item.value === from.font) ? from.font : CAPTION_DEFAULTS.font,
    color: /^#[0-9a-f]{6}$/i.test(from.color) ? from.color : CAPTION_DEFAULTS.color,
  };
};

// Estilo en linea de cada linea de subtitulo: tamaño base por el factor del usuario, y fondo negro con su opacidad.
// En el reproductor el tamaño base sale del ancho de la ventana (vw); en la vista previa de Ajustes,
// del ancho de la propia imagen (cqw, con `container-type` en ella), como si la imagen fuera la pantalla.
export const captionCss = ({ size, opacity, color, font }, preview = false) => ({
  color,
  fontFamily: CAPTION_FONTS.find((item) => item.value === font)?.css,
  fontSize: `calc(${preview ? '2.3cqw' : 'clamp(15px, 2.3vw, 30px)'} * ${size / 100})`,
  backgroundColor: `rgb(0 0 0 / ${opacity / 100})`,
});

// Cómo se muestra una pista de audio: el nombre que le puso el administrador y, si no tiene (el
// manifiesto trae uno genérico, "audio_1"), el del idioma.
export const audioLabel = (track, fallback) =>
  (track.name && !/^audio_\d+$/.test(track.name) ? track.name : null)
  || (track.lang && languageName(track.lang, track.name))
  || track.name
  || fallback;
