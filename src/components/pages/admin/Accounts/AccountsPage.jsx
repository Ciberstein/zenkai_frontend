import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { accountsThunk } from '../../../../store/slices/accounts.slice'
import { API_ROUTES } from '../../../../api/routes'
import api from '../../../../api/axios'
import { Input, Select, Tag } from '../../../material'
import useDebounce from '../../../../../hooks/useDebounce'
import Avatar from '../../../shared/Avatar'
import NoData from '../../../shared/NoData'
import formatDate from '../../../../utils/formatDate'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS = [
  { value: 'active', label: 'Activa' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'banned', label: 'Suspendida' },
];

const COLORS = { active: 'accent', pending: 'outline', banned: 'danger' };

// ─── AccountsPage ─────────────────────────────────────────────────────────────

export const AccountsPage = () => {

  const [query, setQuery] = React.useState('');
  const debounced = useDebounce(query);
  const dispatch = useDispatch();

  const accounts = useSelector(state => state.accounts);
  const account = useSelector(state => state.account);

  React.useEffect(() => {
    dispatch(accountsThunk({ q: debounced }));
  }, [debounced]);

  const setStatus = async (row, status) => {
    await api.patch(`${API_ROUTES.ADMIN}/accounts/${row.id}`, { status });
    dispatch(accountsThunk({ q: debounced }));
  };

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl md:text-4xl">Cuentas</h1>

      <Input
        name="q"
        placeholder="Buscar por usuario o email"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="max-w-xs"
      />

      {accounts.data.length ? (
        <ul className="flex flex-col gap-2">
          {accounts.data.map((row) => {
            // El backend tambien lo rechaza, pero deshabilitarlo evita el 403
            // al intentar moderarse a uno mismo o a un igual.
            const locked = row.id === account?.id || row.authority >= account?.authority;

            return (
              <li
                key={row.id}
                className="flex flex-wrap items-center gap-3 border border-line bg-surface p-3"
              >
                <Avatar src={row.profile?.avatar} name={row.username} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{row.username}</p>
                  <p className="truncate text-[11px] text-muted">{row.email}</p>
                </div>

                <Tag color="outline">Nivel {row.authority}</Tag>
                <Tag color={COLORS[row.status]}>{row.status}</Tag>

                <span className="hidden text-[10px] uppercase tracking-widest text-muted sm:block">
                  {formatDate(row.createdAt)}
                </span>

                {!locked && (
                  <Select
                    size="sm"
                    value={row.status}
                    onChange={(value) => setStatus(row, value)}
                    data={STATUS}
                    className="min-w-32"
                  />
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <NoData message="Sin cuentas para mostrar" />
      )}
    </div>
  )
}
