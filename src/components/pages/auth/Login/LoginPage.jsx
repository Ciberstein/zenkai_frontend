import React from 'react'
import { Link } from 'react-router-dom'
import AuthShell from '../AuthShell'
import LoginForm from './partials/LoginForm'

export const LoginPage = () => (
  <AuthShell
    title="Iniciar sesión"
    subtitle="Continúa donde lo dejaste."
    footer={
      <>
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="font-semibold text-accent-text hover:underline">Crear una</Link>
        <br />
        <Link to="/recovery" className="transition-colors hover:text-accent-text">¿Olvidaste tu contraseña?</Link>
      </>
    }
  >
    <LoginForm />
  </AuthShell>
)
