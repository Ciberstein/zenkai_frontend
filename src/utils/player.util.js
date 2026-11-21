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
export const languageName = (code, fallback) => {
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
