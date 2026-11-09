import React from 'react'
import { Link } from 'react-router-dom'
import AuthShell from '../AuthShell'
import RecoveryForm from './partials/RecoveryForm'

export const RecoveryPage = () => (
  <AuthShell
    title="Recuperar acceso"
    subtitle="Te enviaremos un enlace para restablecer tu contraseña."
    footer={<Link to="/login" className="font-semibold text-accent-text hover:underline">Volver al login</Link>}
  >
    <RecoveryForm />
  </AuthShell>
)
