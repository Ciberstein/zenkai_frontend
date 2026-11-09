import React from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { setProfile } from '../../../../../store/slices/account.slice'
import { API_ROUTES } from '../../../../../api/routes'
import api from '../../../../../api/axios'
import { Button, Input, Select, Textarea } from '../../../../material'

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

  const onSubmit = async ({ nickname, bio, avatar }) => {
    const res = await api.patch(`${API_ROUTES.USER}/profile`, { nickname, bio, avatar, language });
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

      <Input full name="nickname" label="Nombre público" register={field()} />
      <Input full name="avatar" label="Avatar (URL)" register={field()} />
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
