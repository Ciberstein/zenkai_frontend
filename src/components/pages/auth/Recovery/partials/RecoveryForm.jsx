import React from 'react'
import { useForm } from 'react-hook-form'
import { Button, Input } from '../../../../material'

// El endpoint de recuperacion aun no existe en el backend (necesita el servicio
// de correo). El formulario ya valida y deja el hueco listo.
const RecoveryForm = () => {

  const { register, handleSubmit, formState: { errors } } = useForm();
  const [sent, setSent] = React.useState(false);

  return (
    <form onSubmit={handleSubmit(() => setSent(true))} className="flex flex-col gap-4">
      {sent && (
        <p role="status" className="border border-line bg-accent/20 px-3 py-2 text-sm font-bold">
          Si el email existe, recibirás instrucciones.
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

      <Button full size="lg" type="submit">Enviar</Button>
    </form>
  )
}

export default RecoveryForm
