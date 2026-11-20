// Estados de una subida de episodio que todavia estan en curso en el servidor.
export const UPLOAD_BUSY = ['uploading', 'queued', 'processing'];

// La subida mas reciente de un episodio: el listado trae lo que esta en curso y lo
// terminado hace poco, y el admin solo necesita la ultima.
export const latestUpload = (episode) =>
  [...(episode.uploads ?? [])].sort((a, b) => b.id - a.id)[0] ?? null;
