import React from 'react'
import clsx from 'clsx'
import { Link, useParams } from 'react-router-dom'
import { API_ROUTES } from '../../../../api/routes'
import api from '../../../../api/axios'
import uploads from '../../../../services/uploads.services'
import { UPLOAD_BUSY, latestUpload } from '../../../../utils/upload.util'
import { Button } from '../../../material'
import Icon from '../../../shared/Icon'
import NoData from '../../../shared/NoData'
import EpisodeRow from './partials/EpisodeRow'
import SourceDialog from './partials/SourceDialog'
import AudioDialog from './partials/AudioDialog'
import SubtitleDialog from './partials/SubtitleDialog'
import UploadDialog from './partials/UploadDialog'

// Series largas (cientos de episodios): se pintan por tandas.
const PAGE = 100;

const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'with', label: 'Con video' },
  { key: 'without', label: 'Sin video' },
];

export const EpisodesPage = () => {

  const { id } = useParams();

  const [episodes, setEpisodes] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [subtitling, setSubtitling] = React.useState(null);
  const [dubbing, setDubbing] = React.useState(null);
  const [uploading, setUploading] = React.useState(null);
  const [dropped, setDropped] = React.useState(null);
  const [syncing, setSyncing] = React.useState(false);
  const [filter, setFilter] = React.useState('all');
  const [limit, setLimit] = React.useState(PAGE);
  const [opened, setOpened] = React.useState(() => new Set());

  const load = React.useCallback(async () => {
    const res = await api.get(`${API_ROUTES.ADMIN}/anime/${id}/episodes`);
    setEpisodes(res.data);
  }, [id]);

  React.useEffect(() => { load() }, [load]);

  // Mientras algo se esta convirtiendo, se refresca solo para ver el avance y el resultado.
  const converting = episodes.some((episode) => ['queued', 'processing'].includes(latestUpload(episode)?.status));

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

  // Estables a proposito: las filas estan memorizadas y no deben repintarse todas por cada refresco.
  const toggle = React.useCallback((episodeId) => {
    setOpened((current) => {
      const next = new Set(current);
      if (next.has(episodeId)) next.delete(episodeId);
      else next.add(episodeId);
      return next;
    });
  }, []);

  const removeSource = React.useCallback(async (sourceId) => {
    await api.delete(`${API_ROUTES.ADMIN}/anime/sources/${sourceId}`);
    load();
  }, [load]);

  const removeSubtitle = React.useCallback(async (subtitleId) => {
    await api.delete(`${API_ROUTES.ADMIN}/anime/subtitles/${subtitleId}`);
    load();
  }, [load]);

  const retryUpload = React.useCallback(async (uploadId) => {
    await uploads.retry(uploadId);
    load();
  }, [load]);

  const discardUpload = React.useCallback(async (uploadId) => {
    await uploads.remove(uploadId);
    load();
  }, [load]);

  const openUpload = React.useCallback((episode, files = null) => {
    setDropped(files);
    setUploading(episode);
  }, []);

  const withVideo = episodes.filter((episode) => episode.sources?.length > 0).length;

  const counts = { all: episodes.length, with: withVideo, without: episodes.length - withVideo };

  const shown = episodes.filter((episode) => {
    const has = episode.sources?.length > 0;
    return filter === 'all' || (filter === 'with' ? has : !has);
  });

  const busyCount = episodes.filter((episode) => UPLOAD_BUSY.includes(latestUpload(episode)?.status)).length;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Link
            to="/admin/catalog"
            className="group/back inline-flex w-fit items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-accent-text"
          >
            <Icon name="arrow-left" className="size-3.5 transition-transform group-hover/back:-translate-x-0.5" />
            Catálogo
          </Link>

          <h1 className="text-4xl">Episodios</h1>

          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            {episodes.length} {episodes.length === 1 ? 'episodio' : 'episodios'} · {withVideo} con video
            {busyCount > 0 && <span className="text-accent-text"> · {busyCount} en proceso</span>}
          </p>
        </div>

        <Button size="sm" loading={syncing} onClick={sync}>↻ Sincronizar</Button>
      </header>

      {episodes.length > 0 && (
        <div role="tablist" aria-label="Filtrar episodios" className="flex w-fit border border-line bg-surface">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={filter === item.key}
              onClick={() => { setFilter(item.key); setLimit(PAGE); }}
              className={clsx(
                'flex cursor-pointer items-center gap-2 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors',
                filter === item.key ? 'bg-accent text-accent-fg' : 'text-muted hover:bg-surface-2 hover:text-fg',
              )}
            >
              {item.label}
              <span className={clsx('tnum', filter === item.key ? 'text-accent-fg/70' : 'text-fg/50')}>{counts[item.key]}</span>
            </button>
          ))}
        </div>
      )}

      {shown.length ? (
        <>
          <ul className="flex flex-col gap-2">
            {shown.slice(0, limit).map((episode) => (
              <EpisodeRow
                key={episode.id}
                episode={episode}
                open={opened.has(episode.id)}
                onToggle={toggle}
                onUpload={openUpload}
                onSource={setSelected}
                onSubtitle={setSubtitling}
                onAudio={setDubbing}
                onRemoveSource={removeSource}
                onRemoveSubtitle={removeSubtitle}
                onRetry={retryUpload}
                onDiscard={discardUpload}
              />
            ))}
          </ul>

          {shown.length > limit && (
            <Button color="ghost" size="sm" className="self-center" onClick={() => setLimit((current) => current + PAGE)}>
              Mostrar {Math.min(PAGE, shown.length - limit)} más · quedan {shown.length - limit}
            </Button>
          )}
        </>
      ) : (
        <NoData message={episodes.length ? 'Ningún episodio coincide con este filtro' : 'Sincroniza para traer la lista de episodios'} />
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

      {dubbing && (
        <AudioDialog
          episode={dubbing}
          open={Boolean(dubbing)}
          onClose={() => setDubbing(null)}
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
