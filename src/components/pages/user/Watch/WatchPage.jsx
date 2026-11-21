import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Context } from '../../../../context'
import { animeThunk } from '../../../../store/slices/anime.slice'
import { episodesThunk, episodeThunk } from '../../../../store/slices/episodes.slice'
import Player from './partials/Player'
import PlayerTopBar from './partials/PlayerTopBar'

// Un marco que tapa toda la pantalla, por encima incluso de las lineas CRT del tema
// oscuro (z 9998): aqui manda el video. Sin barra superior ni lista de episodios;
// volver a la serie, cambiar de episodio y de servidor viven dentro del reproductor.
const Stage = ({ children }) => (
  <div className="fixed inset-0 z-9999 overflow-hidden bg-black">{children}</div>
)

export const WatchPage = () => {

  const { malId, number } = useParams();
  const { auth } = React.useContext(Context.Auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const anime = useSelector(state => state.anime);
  const episodes = useSelector(state => state.episodes);
  const config = useSelector(state => state.config);

  const [episode, setEpisode] = React.useState(null);
  const [source, setSource] = React.useState(null);

  React.useEffect(() => {
    if (anime?.mal_id !== Number(malId)) dispatch(animeThunk(malId));
    dispatch(episodesThunk(malId));
  }, [malId]);

  React.useEffect(() => {
    setEpisode(null);

    dispatch(episodeThunk(malId, number)).then((data) => {
      setEpisode(data);
      // Preferencia por defecto: la primera fuente subtitulada, que suele estar
      // disponible antes que el doblaje.
      setSource(data?.sources?.find((item) => item.language === 'sub') ?? data?.sources?.[0] ?? null);
    });
  }, [malId, number]);

  const index = episodes.findIndex((item) => item.number === Number(number));
  const previous = index > 0 ? episodes[index - 1] : null;
  const next = index >= 0 && index < episodes.length - 1 ? episodes[index + 1] : null;

  const goTo = (item) => () => navigate(`/watch/${malId}/${item.number}`);
  const close = () => navigate(`/anime/${malId}`);

  // El titulo de la serie solo cuando ya es la de esta pagina: el store puede tener
  // todavia la anterior mientras carga.
  const seriesTitle = anime?.mal_id === Number(malId) ? (anime?.titleEnglish ?? anime?.title) : null;

  // El reproductor ya guardo el final antes de llamar aqui: se recarga la lista
  // para que el episodio salga como visto, haya o no siguiente.
  const onEnded = async () => {
    if (auth) await dispatch(episodesThunk(malId));
    if (config?.['player_auto_next'] && next) navigate(`/watch/${malId}/${next.number}`);
  };

  if (!episode) {
    return (
      <Stage>
        <PlayerTopBar seriesTitle={seriesTitle} onClose={close} />

        <div className="absolute inset-0 grid place-items-center">
          <span className="size-12 animate-spin rounded-full border-2 border-white/20 border-t-accent" role="status" aria-label="Cargando" />
        </div>
      </Stage>
    )
  }

  const episodeLabel = `${t('Episode')} ${episode.number}${episode.title ? ` · ${episode.title}` : ''}`;

  return (
    <Stage>
      <Player
        episode={episode}
        source={source}
        auth={auth}
        onEnded={onEnded}
        seriesTitle={seriesTitle}
        episodeLabel={episodeLabel}
        onClose={close}
        onPrev={previous ? goTo(previous) : null}
        onNext={next ? goTo(next) : null}
        sources={episode.sources ?? []}
        onSource={setSource}
      />
    </Stage>
  )
}
