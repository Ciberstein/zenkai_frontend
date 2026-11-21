import React from 'react'
import uploads from '../../../../../services/uploads.services'

// Audios del episodio, leídos del manifiesto publicado. Se vuelven a leer cuando cambia la
// última subida (por ejemplo, al terminar de añadir un doblaje).
const useAudio = (episodeId, enabled, version) => {

  const [tracks, setTracks] = React.useState(null);
  const [error, setError] = React.useState(null);

  const load = React.useCallback(() => {
    if (!enabled) return;

    uploads.audio(episodeId)
      .then((list) => { setTracks(list); setError(null); })
      .catch((err) => setError(err.response?.data?.message ?? err.message));
  }, [episodeId, enabled]);

  React.useEffect(() => { load() }, [load, version]);

  return { tracks, error, setError, load };
}

export default useAudio
