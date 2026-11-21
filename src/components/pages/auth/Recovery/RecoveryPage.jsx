import React from 'react'
import { Link } from 'react-router-dom'
import AuthShell from '../AuthShell'
import RecoveryForm from './partials/RecoveryForm'
import ResetForm from './partials/ResetForm'

export const RecoveryPage = () => {

  // Dos pasos: el correo y, después, el código con la contraseña nueva.
  const [sent, setSent] = React.useState(null);

  return (
    <AuthShell
      title="Recuperar acceso"
      subtitle={sent
        ? <>Si <strong className="text-fg">{sent.email}</strong> tiene cuenta, te hemos enviado un código de 6 dígitos.</>
        : 'Te enviaremos un código por correo para restablecer tu contraseña.'}
      footer={<Link to="/login" className="font-semibold text-accent-text hover:underline">Volver al login</Link>}
    >
      {sent
        ? <ResetForm {...sent} onBack={() => setSent(null)} />
        : <RecoveryForm onSent={setSent} />}
    </AuthShell>
  )
}
