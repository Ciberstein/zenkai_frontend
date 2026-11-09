import React from 'react'
import { useForm } from 'react-hook-form'
import { API_ROUTES } from '../../../../../api/routes'
import api from '../../../../../api/axios'
import { Button, Input } from '../../../../material'
import clsx from 'clsx'

const PasswordForm = () => {

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [message, setMessage] = React.useState(null);

  const field = (rules) => ({ function: register, errors: { function: errors, rules } });

  // El backend invalida todas las sesiones al cambiar la clave, asi que hay que
  // volver a entrar: se avisa antes de mandar al login.
  const onSubmit = async ({ current, password }) => {
    try {
      await api.patch(`${API_ROUTES.USER}/account/password`, { current, password });
      setMessage({ ok: true, text: 'Contraseña actualizada, vuelve a iniciar sesión' });
      setTimeout(() => window.location.assign('/login'), 2000);
    } catch (err) {
      setMessage({ ok: false, text: err.response?.data?.message ?? 'No se pudo actualizar' });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-md flex-col gap-4">
      {message && (
        <p
          role={message.ok ? 'status' : 'alert'}
          className={clsx(
 'border px-3 py-2 text-sm font-bold',
            message.ok ? 'border-line bg-accent/20' : 'border-red-500 bg-red-500/10 text-red-400',
          )}
        >
          {message.text}
        </p>
      )}

      <Input
        full
        type="password"
        name="current"
        label="Contraseña actual"
        register={field({ required: 'Campo obligatorio' })}
      />

      <Input
        full
        type="password"
        name="password"
        label="Nueva contraseña"
        register={field({
          required: 'Campo obligatorio',
          pattern: {
            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
            message: 'Mínimo 8 caracteres con mayúscula, minúscula y número',
          },
        })}
      />

      <Button type="submit" color="danger" loading={isSubmitting}>Cambiar contraseña</Button>
    </form>
  )
}

export default PasswordForm
