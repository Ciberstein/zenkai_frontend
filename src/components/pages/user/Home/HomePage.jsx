import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Context } from '../../../../context'
import { homeThunk } from '../../../../store/slices/home.slice'
import { resumeThunk } from '../../../../store/slices/resume.slice'
import { HeroSkeleton } from '../../../material'
import Rail from '../../../shared/Rail'
import Hero from './partials/Hero'
import ResumeRail from './partials/ResumeRail'

export const HomePage = () => {

  const { auth } = React.useContext(Context.Auth);
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const home = useSelector(state => state.home);
  const resume = useSelector(state => state.resume);
  const config = useSelector(state => state.config);

  React.useEffect(() => {
    dispatch(homeThunk({ limit: config?.['catalog_home_rails'] }));
  }, [config?.['catalog_home_rails']]);

  React.useEffect(() => {
    if (auth) dispatch(resumeThunk());
  }, [auth]);

  const empty = !home.top?.length && !home.now?.length;

  if (empty) return <HeroSkeleton />;

  // Lo marcado como destacado desde el panel manda; si no hay nada, la
  // portada se alimenta de lo mas popular para no quedar vacia.
  const spotlight = home.featured?.length ? home.featured : home.top;

  return (
    <div className="flex flex-col gap-14 pb-4">
      <Hero items={spotlight} auth={auth} />

      {auth && <ResumeRail items={resume} />}

      <Rail
        eyebrow="Lo más visto"
        title={t('Top anime')}
        items={home.top}
        to="/catalog?order_by=score&sort=desc"
        ranked
      />
      <Rail eyebrow="Esta temporada" title={t('Airing now')} items={home.now} to="/seasons" />
      <Rail title={t('Featured')} items={home.featured} to="/catalog" />
      <Rail title={t('Latest added')} items={home.latest} to="/catalog" />
    </div>
  )
}
