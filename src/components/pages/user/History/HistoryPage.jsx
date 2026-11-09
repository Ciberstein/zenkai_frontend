import React from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { historyThunk } from '../../../../store/slices/history.slice'
import { API_ROUTES } from '../../../../api/routes'
import api from '../../../../api/axios'
import { Button } from '../../../material'
import NoData from '../../../shared/NoData'
import PageHeader from '../../../shared/PageHeader'
import formatTime from '../../../../utils/formatTime'
import formatDate from '../../../../utils/formatDate'
import percent from '../../../../utils/progress.util'

export const HistoryPage = () => {

  const dispatch = useDispatch();
  const { t } = useTranslation();

  const history = useSelector(state => state.history);

  React.useEffect(() => {
    dispatch(historyThunk());
  }, []);

  const clear = async () => {
    await api.delete(`${API_ROUTES.USER}/history`);
    dispatch(historyThunk());
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Tu biblioteca" title={t('History')}>
        {history.data.length > 0 && (
          <Button color="danger" size="sm" onClick={clear}>Borrar historial</Button>
        )}
      </PageHeader>

      {history.data.length ? (
        <ul className="stagger flex flex-col gap-3">
          {history.data.map((entry) => (
            <li key={entry.id}>
              <Link
                to={`/watch/${entry.anime?.malId}/${entry.episode?.number}`}
                className="flex items-center gap-4 border border-line bg-surface/60 p-3 transition-[background-color,transform] duration-200 hover:bg-surface-2/70"
              >
                <img
                  src={entry.episode?.thumbnail ?? entry.anime?.image}
                  alt=""
                  loading="lazy"
                  className="h-16 w-28 shrink-0 object-cover"
                />

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-[15px] font-semibold">{entry.anime?.title}</p>
                  <p className="text-xs text-muted tnum">
                    {t('Episode')} {entry.episode?.number} · {formatTime(entry.progress)} / {formatTime(entry.duration)}
                  </p>

                  <div className="mt-2 h-0.75 w-full max-w-64 overflow-hidden bg-surface-2">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${percent(entry.progress, entry.duration)}%` }}
                    />
                  </div>
                </div>

                <span className="hidden shrink-0 text-xs text-muted sm:block">
                  {formatDate(entry.updatedAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <NoData message="Todavía no viste ningún episodio" />
      )}
    </div>
  )
}
