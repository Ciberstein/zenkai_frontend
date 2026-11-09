import React from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { adminAnimeThunk } from '../../../../store/slices/admin.anime.slice'
import { accountsThunk } from '../../../../store/slices/accounts.slice'
import { logsThunk } from '../../../../store/slices/logs.slice'

// ─── Stat ─────────────────────────────────────────────────────────────────────

// Los totales salen de la paginacion de cada listado: no hace falta un endpoint
// de metricas para tres numeros que ya vienen en la respuesta.
const Stat = ({ label, value, to }) => (
  <Link
    to={to}
    className="group flex flex-col gap-1 border border-line bg-surface p-5 transition-transform hover:-translate-y-1 hover:shadow-lg shadow-black/30"
  >
    <span className="text-sm text-muted">{label}</span>
    <span className="text-4xl font-bold leading-none tracking-tight">
      {value?.toLocaleString('es') ?? '—'}
    </span>
  </Link>
);

export const HomePage = () => {

  const dispatch = useDispatch();

  const anime = useSelector(state => state.adminAnime);
  const accounts = useSelector(state => state.accounts);
  const logs = useSelector(state => state.logs);

  React.useEffect(() => {
    dispatch(adminAnimeThunk());
    dispatch(accountsThunk());
    dispatch(logsThunk());
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl md:text-4xl">Panel</h1>

      <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Títulos" value={anime.pagination?.total} to="/admin/catalog" />
        <Stat label="Cuentas" value={accounts.pagination?.total} to="/admin/accounts" />
        <Stat label="Eventos" value={logs.pagination?.total} to="/admin/logs" />
      </div>
    </div>
  )
}
