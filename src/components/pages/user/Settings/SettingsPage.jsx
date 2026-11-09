import React from 'react'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { languagesThunk } from '../../../../store/slices/languages.slice'
import { Tabs } from '../../../material'
import PageHeader from '../../../shared/PageHeader'
import ProfileForm from './partials/ProfileForm'
import PasswordForm from './partials/PasswordForm'

export const SettingsPage = () => {

  const [tab, setTab] = React.useState('profile');
  const dispatch = useDispatch();
  const { t } = useTranslation();

  React.useEffect(() => {
    dispatch(languagesThunk());
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Tu cuenta" title={t('Settings')}>
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: 'profile', label: t('Profile') },
            { value: 'security', label: 'Seguridad' },
          ]}
        />
      </PageHeader>

      {tab === 'profile' ? <ProfileForm /> : <PasswordForm />}
    </div>
  )
}
