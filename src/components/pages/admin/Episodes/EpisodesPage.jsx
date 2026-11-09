import React from 'react'
import { useParams } from 'react-router-dom'
import { API_ROUTES } from '../../../../api/routes'
import api from '../../../../api/axios'
import { Button, Tag } from '../../../material'
import NoData from '../../../shared/NoData'
import SourceDialog from './partials/SourceDialog'

export const EpisodesPage = () => {

  const { id } = useParams();

  const [episodes, setEpisodes] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [syncing, setSyncing] = React.useState(false);

  const load = React.useCallback(async () => {
    const res = await api.get(`${API_ROUTES.ADMIN}/anime/${id}/episodes`);
    setEpisodes(res.data);
  }, [id]);

  React.useEffect(() => { load() }, [load]);

  // Trae la lista de episodios. Solo crea las fichas: los enlaces se cargan uno
  // a uno con el diálogo de fuentes.
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
          {episodes.map((episode) => (
            <li key={episode.id} className="flex flex-col gap-2 border border-line bg-surface p-3">
              <div className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center bg-surface-2 text-sm font-semibold">
                  {episode.number}
                </span>

                <span className="min-w-0 flex-1 truncate text-sm font-bold">
                  {episode.title ?? '—'}
                </span>

                <Button color="ghost" size="sm" onClick={() => setSelected(episode)}>
                  + Fuente
                </Button>
              </div>

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
          ))}
        </ul>
      ) : (
        <NoData message="Sincroniza para traer la lista de episodios" />
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
