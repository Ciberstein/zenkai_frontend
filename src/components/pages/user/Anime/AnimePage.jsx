import React from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Context } from '../../../../context'
import { animeThunk, recommendationsThunk } from '../../../../store/slices/anime.slice'
import { episodesThunk } from '../../../../store/slices/episodes.slice'
import { commentsThunk } from '../../../../store/slices/comments.slice'
import library_service from '../../../../services/library.services'
import Rail from '../../../shared/Rail'
import AnimeHeader from './partials/AnimeHeader'
import EpisodeList from './partials/EpisodeList'
import Comments from './partials/Comments'

export const AnimePage = () => {

  const { malId } = useParams();
  const { auth } = React.useContext(Context.Auth);
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const anime = useSelector(state => state.anime);
  const episodes = useSelector(state => state.episodes);

  const [tracked, setTracked] = React.useState(false);
  const [favorited, setFavorited] = React.useState(false);
  const [recommendations, setRecommendations] = React.useState([]);

  React.useEffect(() => {
    dispatch(animeThunk(malId));
    dispatch(episodesThunk(malId));
    dispatch(commentsThunk(malId));
    dispatch(recommendationsThunk(malId)).then(setRecommendations);
    setTracked(false);
    setFavorited(false);
  }, [malId]);

  const onTrack = async () => {
    tracked
      ? await library_service.untrack(malId)
      : await library_service.track(malId, 'watching');
    setTracked((prev) => !prev);
  };

  const onFavorite = async () => {
    favorited
      ? await library_service.unfavorite(malId)
      : await library_service.favorite(malId);
    setFavorited((prev) => !prev);
  };

  if (!anime) return null;

  return (
    <div className="flex flex-col gap-14">
      <AnimeHeader
        anime={anime}
        auth={auth}
        tracked={tracked}
        favorited={favorited}
        firstEpisode={episodes[0]}
        onTrack={onTrack}
        onFavorite={onFavorite}
      />

      <EpisodeList malId={malId} episodes={episodes} />

      <Rail title={t('Recommendations')} items={recommendations} />

      <Comments malId={malId} auth={auth} />
    </div>
  )
}
