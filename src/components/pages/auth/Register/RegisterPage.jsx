import React from 'react'
import { Link } from 'react-router-dom'
import AuthShell from '../AuthShell'
import RegisterForm from './partials/RegisterForm'

export const RegisterPage = () => (
  <AuthShell
    title="Crear cuenta"
    subtitle="Guarda tu progreso y arma tu lista."
    footer={
      <>
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-semibold text-accent-text hover:underline">Iniciar sesión</Link>
      </>
    }
  >
    <RegisterForm />
  </AuthShell>
)
