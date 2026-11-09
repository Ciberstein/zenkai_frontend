import React from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { catalogThunk } from '../../../../store/slices/catalog.slice'
import { Input, PosterGridSkeleton } from '../../../material'
import useDebounce from '../../../../../hooks/useDebounce'
import PageHeader from '../../../shared/PageHeader'
import Grid from '../Catalog/partials/Grid'

export const SearchPage = () => {

  const [params, setParams] = useSearchParams();
  const [query, setQuery] = React.useState(params.get('q') ?? '');

  const debounced = useDebounce(query);
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const catalog = useSelector(state => state.catalog);
  const loader = useSelector(state => state.loader);

  React.useEffect(() => {
    if (!debounced.trim()) return;
    setParams({ q: debounced }, { replace: true });
    dispatch(catalogThunk({ q: debounced, limit: 24 }));
  }, [debounced]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t('Search')} description="Busca por título en español, inglés o japonés." />

      <Input
        full
        autoFocus
        size="lg"
        className="focus-within:border-line!"
        name="q"
        type="search"
        placeholder="Escribe un título…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      {debounced.trim() && (
        !catalog.data.length && !loader
          ? <PosterGridSkeleton count={6} />
          : <Grid items={catalog.data} />
      )}
    </div>
  )
}
