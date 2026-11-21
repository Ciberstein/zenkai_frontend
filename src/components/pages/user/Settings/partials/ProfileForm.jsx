import React from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { setProfile } from '../../../../../store/slices/account.slice'
import { API_ROUTES } from '../../../../../api/routes'
import api from '../../../../../api/axios'
import { clearPrefs } from '../../../../../utils/player.util'
import { Button, Input, Select, Textarea } from '../../../../material'
import AvatarUploader from './AvatarUploader'

const ProfileForm = () => {

  const account = useSelector(state => state.account);
  const languages = useSelector(state => state.languages);
  const dispatch = useDispatch();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    values: account?.profile ?? {},
  });

  const [language, setLanguage] = React.useState(account?.profile?.language ?? 'es');
  const [saved, setSaved] = React.useState(false);

  const field = (rules = {}) => ({ function: register, errors: { function: errors, rules } });

  const onSubmit = async ({ nickname, bio }) => {
    const res = await api.patch(`${API_ROUTES.USER}/profile`, { nickname, bio, language });

    // Si cambió el idioma, lo elegido a mano en el reproductor se olvida: el nuevo se nota ya.
    if (language !== account?.profile?.language) clearPrefs(['audio', 'captions']);
    dispatch(setProfile(res.data));
    reset(res.data);
    setSaved(true);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-md flex-col gap-4">
      {saved && (
        <p role="status" className="border border-line bg-accent/20 px-3 py-2 text-sm font-bold">
          Perfil actualizado
        </p>
      )}

      <AvatarUploader />

      <Input full name="nickname" label="Nombre público" register={field()} />
      <Textarea full name="bio" label="Bio" register={field()} />

      <Select
        full
        label="Idioma"
        value={language}
        onChange={setLanguage}
        data={languages.map((item) => ({ value: item.code, label: item.name }))}
      />

      <Button type="submit" loading={isSubmitting}>Guardar</Button>
    </form>
  )
}

export default ProfileForm
