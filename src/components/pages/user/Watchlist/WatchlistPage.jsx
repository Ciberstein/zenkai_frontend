import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { watchlistThunk } from '../../../../store/slices/watchlist.slice'
import { Tabs, PosterGridSkeleton } from '../../../material'
import AnimeCard from '../../../shared/AnimeCard'
import NoData from '../../../shared/NoData'
import PageHeader from '../../../shared/PageHeader'

const STATUS = ['watching', 'planned', 'completed', 'on_hold', 'dropped'];

export const WatchlistPage = () => {

  const [status, setStatus] = React.useState('watching');
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const watchlist = useSelector(state => state.watchlist);
  const loader = useSelector(state => state.loader);

  React.useEffect(() => {
    dispatch(watchlistThunk({ status }));
  }, [status]);

  const items = STATUS.map((value) => ({ value, label: t(value) }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Tu biblioteca" title={t('Watchlist')}>
        <Tabs items={items} value={status} onChange={setStatus} />
      </PageHeader>

      {!loader ? <PosterGridSkeleton count={6} /> : watchlist.data.length ? (
        <div className="stagger grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {watchlist.data.map((entry) => (
            <AnimeCard key={entry.id} anime={entry.anime} />
          ))}
        </div>
      ) : (
        <NoData message="Todavía no hay títulos en esta lista" />
      )}
    </div>
  )
}
