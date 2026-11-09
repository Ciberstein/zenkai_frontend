// Jikan devuelve el titulo en varios idiomas y no siempre trae el ingles.
// El orden de preferencia sigue el idioma de la interfaz.
export const title = (anime, lang = 'es') => {
  if (!anime) return '';
  if (lang === 'ja') return anime.title_japanese ?? anime.titleJapanese ?? anime.title;
  return anime.title_english ?? anime.titleEnglish ?? anime.title;
};

export const image = (anime) =>
  anime?.images?.webp?.large_image_url ??
  anime?.images?.jpg?.large_image_url ??
  anime?.image ??
 '/images/placeholder.png';

export const malId = (anime) => anime?.mal_id ?? anime?.malId;

export const year = (anime) => anime?.year ?? anime?.aired?.prop?.from?.year ?? null;

export const score = (anime) => (anime?.score ? Number(anime.score).toFixed(1) : null);

// El espejo local guarda el numero de episodios en `episodesCount` (en Jikan
// es `episodes`, que aqui choca con la relacion de episodios reproducibles).
export const episodes = (anime) => anime?.episodesCount ?? anime?.episodes ?? null;

// MyAnimeList cierra muchas sinopsis con una firma entre corchetes que no
// aporta nada al lector.
export const synopsis = (anime) =>
  anime?.synopsis
    ?.replace(/\[Written by [^\]]*\]/gi, '')
    .replace(/\(Source:[^)]*\)/gi, '')
    .trim() || null;

export const STATUS_LABEL = {
  'Currently Airing': 'En emisión',
  'Finished Airing': 'Finalizado',
  'Not yet aired': 'Próximamente',
};

// El detalle de un titulo devuelve los generos con `id`/`slug` locales, pero
// el filtro del catalogo espera el `malId`. Se cruza con la lista global.
export const genreLink = (genres = [], genre) => {
  const found = genres.find((item) => item.id === genre.id || item.slug === genre.slug);
  const value = found?.malId ?? genre.malId ?? genre.mal_id;
  return value ? `/catalog?genres=${value}` : '/catalog';
};
