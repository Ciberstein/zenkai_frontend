import React from 'react'
import { useTranslation } from 'react-i18next'
import Icon from './Icon'

// ─── NoData ───────────────────────────────────────────────────────────────────

// Estado vacio con accion opcional: una pantalla en blanco parece un error
// aunque no lo sea.
const NoData = ({ message = null, action = null }) => {

  const { t } = useTranslation();

  return (
    <div role="status" className="hud flex flex-col items-center justify-center gap-4 border border-dashed border-line px-6 py-20 text-center">
      <span className="grid size-14 place-items-center bg-surface-2 text-muted">
        <Icon name="search" className="size-6" />
      </span>

      <div className="flex flex-col gap-1.5">
        <p className="font-display text-xl font-bold">{t('No results')}</p>
        {message && <p className="max-w-sm text-sm text-muted">{message}</p>}
      </div>

      {action}
    </div>
  )
}

export default NoData
