import React from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { adminAnimeThunk } from '../../../../store/slices/admin.anime.slice'
import { API_ROUTES } from '../../../../api/routes'
import api from '../../../../api/axios'
import { Button, Input, Switch } from '../../../material'
import useDebounce from '../../../../../hooks/useDebounce'
import NoData from '../../../shared/NoData'
import SyncDialog from './partials/SyncDialog'

export const CatalogPage = () => {

  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);

  const debounced = useDebounce(query);
  const dispatch = useDispatch();

  const anime = useSelector(state => state.adminAnime);

  React.useEffect(() => {
    dispatch(adminAnimeThunk({ q: debounced }));
  }, [debounced]);

  const toggle = async (row, field) => {
    await api.patch(`${API_ROUTES.ADMIN}/anime/${row.id}`, { [field]: !row[field] });
    dispatch(adminAnimeThunk({ q: debounced }));
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-4xl">Catálogo</h1>
        <Button size="sm" onClick={() => setOpen(true)}>+ Importar</Button>
      </header>

      <Input
        name="q"
        placeholder="Buscar en el catálogo"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="max-w-xs"
      />

      {anime.data.length ? (
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-170 border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-surface/60">
                {['Título', 'MAL', 'Tipo', 'Destacado', 'Visible', ''].map((head) => (
                  <th key={head} className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {anime.data.map((row) => (
                <tr key={row.id} className="border-b border-line/50 transition-colors last:border-0 hover:bg-surface/50">
                  <td className="px-3 py-2 font-bold">{row.title}</td>
                  <td className="px-4 py-3 text-muted">{row.malId}</td>
                  <td className="px-4 py-3 text-muted">{row.type}</td>
                  <td className="px-4 py-3">
                    <Switch checked={row.featured} onChange={() => toggle(row, 'featured')} />
                  </td>
                  <td className="px-4 py-3">
                    <Switch checked={row.visible} onChange={() => toggle(row, 'visible')} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/catalog/${row.id}`}
                      className="text-[11px] font-bold uppercase tracking-widest underline hover:text-accent-text"
                    >
                      Episodios
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <NoData message="Todavía no importaste ningún título" />
      )}

      <SyncDialog open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
