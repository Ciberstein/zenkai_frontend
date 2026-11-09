import React from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button, Input } from '../../../../material'
import auth_service from '../../../../../services/auth.services'

const RegisterForm = () => {

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const [error, setError] = React.useState(null);

  const { t } = useTranslation();

  const field = (rules) => ({ function: register, errors: { function: errors, rules } });

  const onSubmit = async ({ email, username, password }) => {
    setError(null);

    try {
      await auth_service.register({ email, username, password });
      window.location.assign('/');
    } catch (err) {
      setError(err.response?.data?.message ?? 'No se pudo crear la cuenta');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {error && (
        <p role="alert" className="border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">
          {error}
        </p>
      )}

      <Input
        full
        name="email"
        label="Email"
        register={field({
          required: 'Campo obligatorio',
          pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' },
        })}
      />

      <Input
        full
        name="username"
        label="Usuario"
        register={field({
          required: 'Campo obligatorio',
          pattern: { value: /^[a-zA-Z0-9_]{3,20}$/, message: '3-20 caracteres: letras, números o _' },
        })}
      />

      <Input
        full
        type="password"
        name="password"
        label="Contraseña"
        register={field({
          required: 'Campo obligatorio',
          pattern: {
            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
            message: 'Mínimo 8 caracteres con mayúscula, minúscula y número',
          },
        })}
      />

      <Input
        full
        type="password"
        name="confirm"
        label="Repetir contraseña"
        register={field({
          validate: (value) => value === watch('password') || 'Las contraseñas no coinciden',
        })}
      />

      <Button full size="lg" type="submit" loading={isSubmitting}>
        {t('Register')}
      </Button>
    </form>
  )
}

export default RegisterForm
