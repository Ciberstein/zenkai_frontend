// Subida por lotes: reconoce qué es cada archivo (video, audio, subtítulos) y a qué episodio
// pertenece según su nombre.

export const VIDEO = ['.mkv', '.mp4', '.m4v', '.mov', '.avi', '.webm', '.ts'];
export const AUDIO = ['.m4a', '.aac', '.mka', '.mp3', '.flac', '.wav', '.ac3', '.opus', '.ogg'];
export const SUBS = ['.srt', '.ass', '.ssa', '.vtt'];

export const ext = (name) => (name.toLowerCase().match(/\.[a-z0-9]+$/) ?? [''])[0];

export const kindOf = (name) => {
  const e = ext(name);
  return VIDEO.includes(e) ? 'video' : AUDIO.includes(e) ? 'audio' : SUBS.includes(e) ? 'sub' : null;
};

// "ep01.es.srt" → "es". Si el nombre no lo dice, queda vacío y se pide a mano.
export const guessLang = (name) =>
  name.match(/\.([a-z]{2,3}(?:-[A-Za-z0-9]{2,8})?)\.[a-z0-9]+$/i)?.[1]?.toLowerCase() ?? '';

// Números que parecen resolución o códec y no un episodio.
const NOT_EPISODE = new Set([264, 265, 480, 576, 720, 1080, 1440, 2160]);

// Número de episodio a partir del nombre del archivo. Entiende los formatos habituales:
//   01.mkv · 01.es.srt · Serie - 05 [1080p].mkv · [Grupo] Serie - 05v2 (BD).mkv · S01E05 · EP05 · Cap 5
// Devuelve null si no encuentra ninguno (se pide a mano).
export const guessEpisode = (name) => {
  const base = name
    .replace(/\.[a-z0-9]+$/i, '')                              // extensión
    .replace(/\.[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$/i, '')       // idioma (.es)
    .replace(/\[[^\]]*\]|\([^)]*\)/g, ' ')                     // [grupo] (1080p) [hash]
    .trim();

  const found =
    base.match(/S\d{1,2}E(\d{1,4})/i)?.[1]
    ?? base.match(/(?:^|[\s._-])(?:episode|episodio|ep|cap[ií]tulo|cap|e)[\s._-]*(\d{1,4})(?!\d)/i)?.[1]
    ?? base.match(/\s-\s*(\d{1,4})(?:v\d)?(?!\d)/)?.[1]
    ?? base.match(/^(\d{1,4})(?!\d)/)?.[1];

  if (found) return Number(found);

  const numbers = [...base.matchAll(/(?<![\dA-Za-z])(\d{1,4})(?![\dA-Za-z])/g)].map((m) => Number(m[1])).filter((n) => !NOT_EPISODE.has(n));
  return numbers.length ? numbers[numbers.length - 1] : null;
};

export const megabytes = (bytes) => `${(bytes / 1048576).toFixed(bytes > 1.07e9 ? 0 : 1)} MB`;
