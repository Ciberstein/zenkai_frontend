import React from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { API_ROUTES } from '../../../../api/routes'
import api from '../../../../api/axios'
import { Tag } from '../../../material'
import AnimeCard from '../../../shared/AnimeCard'
import Avatar from '../../../shared/Avatar'
import NoData from '../../../shared/NoData'
import formatDate from '../../../../utils/formatDate'

export const ProfilePage = () => {

  const { id } = useParams();
  const { t } = useTranslation();

  const account = useSelector(state => state.account);
  const [profile, setProfile] = React.useState(null);

  // Sin :id el backend resuelve el perfil propio, asi que la misma pagina sirve
  // para "mi perfil" y para el de cualquier otro usuario.
  React.useEffect(() => {
    api.get(`${API_ROUTES.USER}/profile/${id ?? ''}`)
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(null));
  }, [id, account?.id]);

  if (!profile) return <NoData message="Perfil no disponible" />;

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-6 border border-line bg-surface/60 p-6 sm:flex-row sm:items-center sm:p-8">
        <Avatar
          src={profile.profile?.avatar}
          name={profile.username}
          size="size-24"
          className="text-4xl"
        />

        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="font-display-tight text-3xl font-bold md:text-5xl">
            {profile.profile?.nickname ?? profile.username}
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            <Tag>@{profile.username}</Tag>
            <Tag color="outline">Desde {formatDate(profile.createdAt)}</Tag>
          </div>

          {profile.profile?.bio && (
            <p className="max-w-prose text-sm text-muted">{profile.profile.bio}</p>
          )}
        </div>
      </header>

      <section className="flex flex-col gap-5">
        <h2 className="text-[24px] md:text-[32px]">{t('Favorites')}</h2>

        {profile.favorites?.length ? (
          <div className="stagger grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {profile.favorites.map((favorite) => (
              <AnimeCard key={favorite.id} anime={favorite.anime} />
            ))}
          </div>
        ) : (
          <NoData message="Sin favoritos todavía" />
        )}
      </section>
    </div>
  )
}
