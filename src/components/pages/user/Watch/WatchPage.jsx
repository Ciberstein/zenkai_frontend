import React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Context } from '../../../../context'
import { animeThunk } from '../../../../store/slices/anime.slice'
import { episodesThunk, episodeThunk } from '../../../../store/slices/episodes.slice'
import { Skeleton } from '../../../material'
import Icon from '../../../shared/Icon'
import Player from './partials/Player'
import ServerPicker from './partials/ServerPicker'
import clsx from 'clsx'

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

  const onEnded = () => {
    if (config?.['player_auto_next'] && next) navigate(`/watch/${malId}/${next.number}`);
  };

  if (!episode) {
    return (
      <div className="mx-auto w-full max-w-400 px-0 pt-(--nav-h) lg:px-6">
        <Skeleton className="aspect-video w-full " />
      </div>
    )
  }

  const name = episode.title ?? `${t('Episode')} ${episode.number}`;

  return (
    <div className="mx-auto flex w-full max-w-400 flex-col gap-6 pt-(--nav-h) lg:flex-row lg:px-6 lg:pb-10 lg:pt-[calc(var(--nav-h)+1rem)]">
      <div className="min-w-0 flex-1">
        <div className="overflow-hidden bg-black lg:cut-lg">
          <Player episode={episode} source={source} auth={auth} onEnded={onEnded} />
        </div>

        <ServerPicker sources={episode.sources} selected={source} onSelect={setSource} />

        <div className="flex flex-col gap-4 px-4 py-6 lg:px-1">
          <Link
            to={`/anime/${malId}`}
            className="group/back inline-flex w-fit items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-accent-text"
          >
            <Icon name="arrow-left" className="size-4 transition-transform group-hover/back:-translate-x-1" />
            {anime?.titleEnglish ?? anime?.title}
          </Link>

          <h1 className="text-[26px] md:text-4xl">
            <span className="mr-3 text-muted tnum">{episode.number}</span>
            {name}
          </h1>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!previous}
              onClick={() => navigate(`/watch/${malId}/${previous.number}`)}
              className="inline-flex h-11 cursor-pointer items-center gap-2 bg-surface-2 px-5 text-sm font-semibold transition-[background-color,opacity] hover:bg-line disabled:pointer-events-none disabled:opacity-35"
            >
              <Icon name="chevron-left" className="size-4" />
              Anterior
            </button>

            <button
              type="button"
              disabled={!next}
              onClick={() => navigate(`/watch/${malId}/${next.number}`)}
              className="inline-flex h-11 cursor-pointer items-center gap-2 bg-fg px-5 text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-35"
            >
              Siguiente
              <Icon name="chevron-right" className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <aside className="w-full shrink-0 lg:w-88">
        <div className="flex flex-col overflow-hidden border-line bg-surface/60 lg:border">
          <h2 className="flex items-baseline justify-between border-b border-line px-5 py-4 font-sans text-sm font-semibold tracking-normal">
            {t('Episodes')}
            <span className="text-xs font-medium text-muted tnum">{episodes.length}</span>
          </h2>

          <ul className="flex max-h-136 flex-col overflow-y-auto lg:max-h-[calc(100vh-14rem)]">
            {episodes.map((item) => {
              const current = item.number === Number(number);

              return (
                <li key={item.id}>
                  <Link
                    to={`/watch/${malId}/${item.number}`}
                    aria-current={current ? 'true' : undefined}
                    className={clsx(
                      'relative flex items-center gap-4 px-5 py-3.5 text-sm transition-colors',
                      current ? 'bg-accent/10' : 'hover:bg-surface-2/70',
                    )}
                  >
                    {current && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.75 bg-accent" />}

                    <span className={clsx('w-7 shrink-0 text-center font-display text-lg font-bold tnum', current ? 'text-accent-text' : 'text-muted')}>
                      {item.number}
                    </span>

                    <span className={clsx('line-clamp-1 flex-1', current ? 'font-semibold' : 'text-fg/80')}>
                      {item.title ?? `${t('Episode')} ${item.number}`}
                    </span>

                    {current && <Icon name="play" className="size-3.5 shrink-0 text-accent-text" />}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </aside>
    </div>
  )
}
