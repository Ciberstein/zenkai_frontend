import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { scheduleThunk } from '../../../../store/slices/schedule.slice'
import { Tabs } from '../../../material'
import PageHeader from '../../../shared/PageHeader'
import Grid from '../Catalog/partials/Grid'

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = [
  { value: 'monday', label: 'Lun' },
  { value: 'tuesday', label: 'Mar' },
  { value: 'wednesday', label: 'Mié' },
  { value: 'thursday', label: 'Jue' },
  { value: 'friday', label: 'Vie' },
  { value: 'saturday', label: 'Sáb' },
  { value: 'sunday', label: 'Dom' },
];

// ─── SchedulePage ─────────────────────────────────────────────────────────────

export const SchedulePage = () => {

  // getDay() da 0 para domingo, que en este orden es el ultimo.
  const today = DAYS[(new Date().getDay() + 6) % 7].value;

  const [day, setDay] = React.useState(today);
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const schedule = useSelector(state => state.schedule);

  React.useEffect(() => {
    dispatch(scheduleThunk(day));
  }, [day]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Semana en emisión" title={t('Schedule')}>
        <Tabs items={DAYS} value={day} onChange={setDay} />
      </PageHeader>

      <Grid items={schedule} />
    </div>
  )
}
