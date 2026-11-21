// Marcas de un episodio (intro, créditos, resumen): tipos y conversión de tiempos para el admin.

export const SEGMENT_TYPES = [
  { value: 'intro', label: 'Intro' },
  { value: 'outro', label: 'Créditos' },
  { value: 'recap', label: 'Resumen' },
];

// "1:23.5" o "83.5" → 83.5 ; vacío o inválido → null
export const parseClock = (text) => {
  const match = /^\s*(?:(\d+):)?(\d+(?:\.\d+)?)\s*$/.exec(text ?? '');
  if (!match) return null;

  const seconds = Number(match[2]);
  if (match[1] !== undefined && seconds >= 60) return null;

  return Number(match[1] ?? 0) * 60 + seconds;
};

// 93.2 → "1:33.2" ; 83 → "1:23"
export const clock = (seconds) => {
  const whole = Math.floor(seconds);
  const tenth = Math.round((seconds - whole) * 10);

  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}${tenth && tenth < 10 ? `.${tenth}` : ''}`;
};
