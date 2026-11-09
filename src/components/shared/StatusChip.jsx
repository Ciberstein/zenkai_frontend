import React from 'react'
import { useTranslation } from 'react-i18next'
import { Tag } from '../material'

// ─── StatusChip ───────────────────────────────────────────────────────────────

const COLORS = {
  watching: 'accent',
  planned: 'soft',
  completed: 'solid',
  on_hold: 'outline',
  dropped: 'outline',
};

const StatusChip = ({ status }) => {

  const { t } = useTranslation();

  if (!status) return null;

  return <Tag color={COLORS[status] ?? 'soft'}>{t(status)}</Tag>
}

export default StatusChip
