import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { seasonThunk } from '../../../../store/slices/seasons.slice'
import { Select, PosterGridSkeleton } from '../../../material'
import PageHeader from '../../../shared/PageHeader'
import Grid from '../Catalog/partials/Grid'

// ─── Constants ────────────────────────────────────────────────────────────────

const SEASONS = [
  { value: 'winter', label: 'Invierno' },
  { value: 'spring', label: 'Primavera' },
  { value: 'summer', label: 'Verano' },
  { value: 'fall', label: 'Otoño' },
];

const YEARS = Array.from({ length: 26 }, (_, index) => {
  const year = new Date().getFullYear() + 1 - index;
  return { value: year, label: String(year) };
});

// ─── SeasonsPage ──────────────────────────────────────────────────────────────

export const SeasonsPage = () => {

  const { year, season } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const seasons = useSelector(state => state.seasons);
  const loader = useSelector(state => state.loader);

  React.useEffect(() => {
    dispatch(seasonThunk({ year, season }));
  }, [year, season]);

  // Sin parametros se muestra la temporada en emision; al elegir cualquier
  // filtro se navega a la URL concreta para que quede compartible.
  const go = (key) => (value) => {
    const next = {
      year: key === 'year' ? value : year ?? new Date().getFullYear(),
      season: key === 'season' ? value : season ?? SEASONS[0].value,
    };
    navigate(`/seasons/${next.year}/${next.season}`);
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Por temporada" title={t('Seasons')}>
        <div className="w-32">
          <Select full label={t('Year')} value={year ?? ''} onChange={go('year')} data={YEARS} placeholder="Año" />
        </div>
        <div className="w-44">
          <Select full label="Temporada" value={season ?? ''} onChange={go('season')} data={SEASONS} placeholder="Temporada" />
        </div>
      </PageHeader>

      {!seasons.data.length && !loader
        ? <PosterGridSkeleton />
        : <Grid items={seasons.data} />}
    </div>
  )
}
