import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { favoritesThunk } from '../../../../store/slices/favorites.slice'
import AnimeCard from '../../../shared/AnimeCard'
import NoData from '../../../shared/NoData'
import PageHeader from '../../../shared/PageHeader'

export const FavoritesPage = () => {

  const dispatch = useDispatch();
  const { t } = useTranslation();

  const favorites = useSelector(state => state.favorites);

  React.useEffect(() => {
    dispatch(favoritesThunk());
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Tu biblioteca" title={t('Favorites')} />

      {favorites.length ? (
        <div className="stagger grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {favorites.map((favorite) => (
            <AnimeCard key={favorite.id} anime={favorite.anime} />
          ))}
        </div>
      ) : (
        <NoData message="Aún no marcaste ningún favorito" />
      )}
    </div>
  )
}
