import React from 'react'
import clsx from 'clsx'
import { useParams } from 'react-router-dom'
import { API_ROUTES } from '../../../../api/routes'
import api from '../../../../api/axios'
import uploads from '../../../../services/uploads.services'
import { Button, Tag } from '../../../material'
import NoData from '../../../shared/NoData'
import SourceDialog from './partials/SourceDialog'
import SubtitleDialog from './partials/SubtitleDialog'
import UploadDialog from './partials/UploadDialog'

// Estados de una subida, tal y como los ve el admin.
const UPLOAD_LABEL = {
  uploading: 'Subiendo…',
  queued: 'En cola',
  processing: 'Convirtiendo',
  done: 'Publicado',
  error: 'Error',
};

const BUSY = ['queued', 'processing'];

// La mas reciente: el listado trae lo que esta en curso y lo terminado hace poco.
const latestUpload = (episode) => [...(episode.uploads ?? [])].sort((a, b) => b.id - a.id)[0] ?? null;

export const EpisodesPage = () => {

  const { id } = useParams();

  const [episodes, setEpisodes] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [subtitling, setSubtitling] = React.useState(null);
  const [uploading, setUploading] = React.useState(null);
  const [dropped, setDropped] = React.useState(null);
  const [overId, setOverId] = React.useState(null);
  const [syncing, setSyncing] = React.useState(false);

  const load = React.useCallback(async () => {
    const res = await api.get(`${API_ROUTES.ADMIN}/anime/${id}/episodes`);
    setEpisodes(res.data);
  }, [id]);

  React.useEffect(() => { load() }, [load]);

  // Mientras algo se esta convirtiendo, se refresca solo para ver el avance y el resultado.
  const converting = episodes.some((episode) => BUSY.includes(latestUpload(episode)?.status));

  React.useEffect(() => {
    if (!converting) return;

    const timer = setInterval(load, 4000);
    return () => clearInterval(timer);
  }, [converting, load]);

  // Trae la lista de episodios. Solo crea las fichas: los videos se suben despues.
  const sync = async () => {
    setSyncing(true);
    await api.post(`${API_ROUTES.ADMIN}/anime/${id}/episodes/sync`);
    setSyncing(false);
    load();
  };

  const removeSource = async (sourceId) => {
    await api.delete(`${API_ROUTES.ADMIN}/anime/sources/${sourceId}`);
    load();
  };

  const removeSubtitle = async (subtitleId) => {
    await api.delete(`${API_ROUTES.ADMIN}/anime/subtitles/${subtitleId}`);
    load();
  };

  const retryUpload = async (uploadId) => {
    await uploads.retry(uploadId);
    load();
  };

  const discardUpload = async (uploadId) => {
    await uploads.remove(uploadId);
    load();
  };

  const openUpload = (episode, files = null) => {
    setDropped(files);
    setUploading(episode);
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-4xl">
          Episodios
          <span className="ml-2 font-sans text-sm font-bold text-muted">{episodes.length}</span>
        </h1>

        <Button size="sm" loading={syncing} onClick={sync}>↻ Sincronizar</Button>
      </header>

      {episodes.length ? (
        <ul className="flex flex-col gap-2">
          {episodes.map((episode) => {
            const upload = latestUpload(episode);
            const busy = BUSY.includes(upload?.status);

            return (
              <li
                key={episode.id}
                onDragOver={(event) => { if (!busy) { event.preventDefault(); setOverId(episode.id); } }}
                onDragLeave={() => setOverId((current) => (current === episode.id ? null : current))}
                onDrop={(event) => {
                  event.preventDefault();
                  setOverId(null);
                  if (!busy && event.dataTransfer.files.length) openUpload(episode, event.dataTransfer.files);
                }}
                className={clsx(
                  'flex flex-col gap-2 border bg-surface p-3 transition-colors',
                  overId === episode.id ? 'border-accent bg-accent/10' : 'border-line',
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center bg-surface-2 text-sm font-semibold">
                    {episode.number}
                  </span>

                  <span className="min-w-0 flex-1 truncate text-sm font-bold">
                    {episode.title ?? '—'}
                  </span>

                  <Button size="sm" disabled={busy} onClick={() => openUpload(episode)}>
                    ↑ Subir video
                  </Button>

                  <Button color="ghost" size="sm" onClick={() => setSubtitling(episode)}>
                    + Subtítulos
                  </Button>

                  <Button color="ghost" size="sm" onClick={() => setSelected(episode)}>
                    + Fuente
                  </Button>
                </div>

                {upload && (
                  <div className="ml-12 flex flex-wrap items-center gap-2 text-xs">
                    <Tag color={upload.status === 'error' ? 'danger' : 'outline'}>
                      {UPLOAD_LABEL[upload.status] ?? upload.status}
                    </Tag>

                    {upload.message && upload.status !== 'done' && (
                      <span className={clsx('min-w-0 break-words', upload.status === 'error' ? 'text-red-400' : 'text-muted')}>
                        {upload.message}
                      </span>
                    )}

                    {upload.status === 'error' && (
                      <>
                        <Button color="ghost" size="sm" onClick={() => retryUpload(upload.id)}>Reintentar</Button>
                        <Button color="ghost" size="sm" onClick={() => discardUpload(upload.id)}>Descartar</Button>
                      </>
                    )}
                  </div>
                )}

                {episode.subtitles?.length > 0 && (
                  <ul className="ml-12 flex flex-wrap gap-2">
                    {episode.subtitles.map((subtitle) => (
                      <li key={subtitle.id} className="flex items-center gap-1">
                        <Tag color="outline">
                          CC · {subtitle.label} · {subtitle.language}{subtitle.default ? ' · por defecto' : ''}
                        </Tag>

                        <button
                          type="button"
                          onClick={() => removeSubtitle(subtitle.id)}
                          aria-label={`Eliminar subtítulos ${subtitle.label}`}
                          className="px-1.5 text-xs text-muted transition-colors hover:bg-red-500/15 hover:text-red-400"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {episode.sources?.length > 0 && (
                  <ul className="ml-12 flex flex-wrap gap-2">
                    {episode.sources.map((source) => (
                      <li key={source.id} className="flex items-center gap-1">
                        <Tag color="outline">
                          {source.server} · {source.quality} · {source.language}
                        </Tag>

                        <button
                          type="button"
                          onClick={() => removeSource(source.id)}
                          aria-label={`Eliminar fuente ${source.server}`}
                          className="px-1.5 text-xs text-muted transition-colors hover:bg-red-500/15 hover:text-red-400"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <NoData message="Sincroniza para traer la lista de episodios" />
      )}

      {uploading && (
        <UploadDialog
          episode={uploading}
          open={Boolean(uploading)}
          initialFiles={dropped}
          onClose={() => { setUploading(null); setDropped(null); }}
          onDone={load}
        />
      )}

      {subtitling && (
        <SubtitleDialog
          episode={subtitling}
          open={Boolean(subtitling)}
          onClose={() => setSubtitling(null)}
          onSaved={load}
        />
      )}

      {selected && (
        <SourceDialog
          episode={selected}
          open={Boolean(selected)}
          onClose={() => setSelected(null)}
          onSaved={load}
        />
      )}
    </div>
  )
}
