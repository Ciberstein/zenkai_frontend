import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { logsThunk } from '../../../../store/slices/logs.slice'
import { Button, Tag } from '../../../material'
import NoData from '../../../shared/NoData'
import formatDate from '../../../../utils/formatDate'

export const LogsPage = () => {

  const [page, setPage] = React.useState(1);
  const dispatch = useDispatch();

  const logs = useSelector(state => state.logs);

  React.useEffect(() => {
    dispatch(logsThunk({ page }));
  }, [page]);

  const pages = logs.pagination?.pages ?? 1;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl md:text-4xl">Logs</h1>

      {logs.data.length ? (
        <>
          <ul className="flex flex-col">
            {logs.data.map((log) => (
              <li
                key={log.id}
                className="flex flex-wrap items-center gap-2 border-b border-line/50 py-2.5 text-sm last:border-0"
              >
                <Tag>{log.action}</Tag>
                <span className="font-bold">{log.actor?.username ?? 'sistema'}</span>
                {log.target && <span className="text-muted">→ {log.target.username}</span>}
                <span className="ml-auto text-xs text-muted">
                  {formatDate(log.createdAt)}
                </span>
              </li>
            ))}
          </ul>

          <nav aria-label="Paginación" className="flex items-center gap-3">
            <Button color="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              ← Anterior
            </Button>

            <span className="text-xs font-bold uppercase tracking-widest text-muted">
              {page} / {pages}
            </span>

            <Button color="ghost" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>
              Siguiente →
            </Button>
          </nav>
        </>
      ) : (
        <NoData message="Sin eventos registrados" />
      )}
    </div>
  )
}
