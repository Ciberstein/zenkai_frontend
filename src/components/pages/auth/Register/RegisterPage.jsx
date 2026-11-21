import React from 'react'
import { Link } from 'react-router-dom'
import AuthShell from '../AuthShell'
import VerifyForm from '../VerifyForm'
import RegisterForm from './partials/RegisterForm'

export const RegisterPage = () => {

  // Con la verificación por correo activa, crear la cuenta lleva a un segundo paso: el código.
  const [pending, setPending] = React.useState(null);

  return (
    <AuthShell
      title={pending ? 'Verifica tu correo' : 'Crear cuenta'}
      subtitle={pending ? <>Te enviamos un código de 6 dígitos a <strong className="text-fg">{pending.email}</strong>.</> : 'Guarda tu progreso y arma tu lista.'}
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-accent-text hover:underline">Iniciar sesión</Link>
        </>
      }
    >
      {pending
        ? <VerifyForm {...pending} onBack={() => setPending(null)} />
        : <RegisterForm onPending={setPending} />}
    </AuthShell>
  )
}
