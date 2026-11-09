import React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Select } from '../../../../material'

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPES = ['TV', 'Movie', 'OVA', 'Special', 'ONA'];
const STATUS = [
  { value: 'Currently Airing', label: 'En emisión' },
  { value: 'Finished Airing', label: 'Finalizado' },
  { value: 'Not yet aired', label: 'Próximamente' },
];
const ORDER = [
  { value: 'popularity', label: 'Popularidad' },
  { value: 'score', label: 'Puntuación' },
  { value: 'members', label: 'Miembros' },
  { value: 'start_date', label: 'Fecha' },
  { value: 'title', label: 'Título' },
];

// ─── Filters ──────────────────────────────────────────────────────────────────

const Filters = ({ value, onChange }) => {

  const genres = useSelector(state => state.genres);
  const { t } = useTranslation();

  const set = (key) => (next) => onChange({ ...value, [key]: next, page: 1 });

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Select
        full
        label={t('Genres')}
        value={value.genres ?? ''}
        onChange={set('genres')}
        placeholder="Todos"
        data={[
          { value: '', label: 'Todos' },
          ...genres.map((genre) => ({ value: genre.malId, label: genre.name })),
        ]}
      />

      <Select
        full
        label={t('Type')}
        value={value.type ?? ''}
        onChange={set('type')}
        placeholder="Todos"
        data={[{ value: '', label: 'Todos' }, ...TYPES.map((type) => ({ value: type, label: type }))]}
      />

      <Select
        full
        label={t('Status')}
        value={value.status ?? ''}
        onChange={set('status')}
        placeholder="Todos"
        data={[{ value: '', label: 'Todos' }, ...STATUS]}
      />

      <Select
        full
        label="Orden"
        value={value.order_by ?? 'popularity'}
        onChange={set('order_by')}
        data={ORDER}
      />
    </div>
  )
}

export default Filters
