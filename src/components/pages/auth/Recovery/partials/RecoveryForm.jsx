import React from 'react'
import { useForm } from 'react-hook-form'
import { Button, Input } from '../../../../material'
import auth_service from '../../../../../services/auth.services'
import { spanish } from '../../../../../utils/auth.util'

// Paso 1 de la recuperación: el correo. El servidor responde igual exista o no la cuenta, así
// que siempre se pasa al paso del código (no se revela quién está registrado).
const RecoveryForm = ({ onSent }) => {

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [error, setError] = React.useState(null);

  const onSubmit = async ({ email }) => {
    setError(null);

    try {
      const res = await auth_service.recover(email.trim().toLowerCase());
      onSent({ email: email.trim().toLowerCase(), wait: res.data?.wait ?? 0 });
    } catch (err) {
      setError(spanish(err.response?.data?.message, 'No se pudo enviar el código'));
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
        register={{
          function: register,
          errors: {
            function: errors,
            rules: {
              required: 'Campo obligatorio',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' },
            },
          },
        }}
      />

      <Button full size="lg" type="submit" loading={isSubmitting}>Enviar código</Button>
    </form>
  )
}

export default RecoveryForm
