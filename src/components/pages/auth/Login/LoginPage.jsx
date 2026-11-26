import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import AuthShell from '../AuthShell'
import VerifyForm from '../VerifyForm'
import LoginForm from './partials/LoginForm'
import TvLogin from './partials/TvLogin'
import { isTV } from '../../../../utils/tv'

export const LoginPage = () => {

  // Una cuenta que nunca confirmó el correo recibe un código nuevo y continúa desde aquí.
  const [pending, setPending] = React.useState(null);

  // Mensaje que deja otra pantalla al venir aquí (p. ej. «Contraseña actualizada»).
  const notice = useLocation().state?.notice ?? null;

  // En una TV se entra con un QR; el formulario queda como alternativa.
  const [manual, setManual] = React.useState(false);

  if (isTV && !manual) return <TvLogin onManual={() => setManual(true)} />;

  return (
  <AuthShell
    title={pending ? 'Verifica tu correo' : 'Iniciar sesión'}
    subtitle={pending ? <>Te enviamos un código de 6 dígitos a <strong className="text-fg">{pending.email}</strong>.</> : 'Continúa donde lo dejaste.'}
    footer={
      <>
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="font-semibold text-accent-text hover:underline">Crear una</Link>
        <br />
        <Link to="/recovery" className="transition-colors hover:text-accent-text">¿Olvidaste tu contraseña?</Link>
      </>
    }
  >
    {pending
      ? <VerifyForm {...pending} onBack={() => setPending(null)} />
      : <LoginForm onPending={setPending} notice={notice} />}
  </AuthShell>
  )
}
