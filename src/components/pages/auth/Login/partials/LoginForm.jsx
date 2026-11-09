import React from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button, Input } from '../../../../material'
import auth_service from '../../../../../services/auth.services'

const LoginForm = () => {

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [error, setError] = React.useState(null);

  const { t } = useTranslation();

  const onSubmit = async (credentials) => {
    setError(null);

    try {
      await auth_service.login(credentials);
      // Recarga completa en vez de navigate: el contexto de sesion se resuelve
      // al montar, asi queda consistente en todo el arbol.
      window.location.assign('/');
    } catch (err) {
      setError(err.response?.data?.message ?? 'No se pudo iniciar sesión');
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
        name="identifier"
        label="Email o usuario"
        register={{ function: register, errors: { function: errors, rules: { required: 'Campo obligatorio' } } }}
      />

      <Input
        full
        type="password"
        name="password"
        label="Contraseña"
        register={{ function: register, errors: { function: errors, rules: { required: 'Campo obligatorio' } } }}
      />

      <Button full size="lg" type="submit" loading={isSubmitting}>
        {t('Login')}
      </Button>
    </form>
  )
}

export default LoginForm
