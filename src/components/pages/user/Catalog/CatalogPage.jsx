import React from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { catalogThunk } from '../../../../store/slices/catalog.slice'
import { PosterGridSkeleton } from '../../../material'
import useInfiniteScroll from '../../../../../hooks/useInfiniteScroll'
import PageHeader from '../../../shared/PageHeader'
import Filters from './partials/Filters'
import Grid from './partials/Grid'

export const CatalogPage = () => {

  const [params, setParams] = useSearchParams();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const catalog = useSelector(state => state.catalog);
  const loader = useSelector(state => state.loader);

  const [filters, setFilters] = React.useState(() => ({
    genres: params.get('genres') ?? '',
    type: params.get('type') ?? '',
    status: params.get('status') ?? '',
    order_by: params.get('order_by') ?? 'popularity',
    sort: params.get('sort') ?? '',
    page: 1,
  }));

  // Los filtros viven en la URL para que la vista se pueda compartir y el boton
  // atras del navegador devuelva lo mismo.
  React.useEffect(() => {
    const clean = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
    setParams(clean, { replace: true });
    dispatch(catalogThunk(clean, { append: clean.page > 1 }));
  }, [filters]);

  const sentinel = useInfiniteScroll(
    () => setFilters((prev) => ({ ...prev, page: prev.page + 1 })),
    { enabled: Boolean(catalog.pagination?.has_next_page) && loader },
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={catalog.pagination?.total > 0 ? `${catalog.pagination.total.toLocaleString('es')} títulos` : null}
        title={t('Catalog')}
      />

      <Filters value={filters} onChange={setFilters} />

      {!catalog.data.length && !loader
        ? <PosterGridSkeleton />
        : <Grid items={catalog.data} />}

      <div ref={sentinel} className="h-px w-full" />
    </div>
  )
}
