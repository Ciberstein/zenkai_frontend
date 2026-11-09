import React from 'react'
import { useSelector } from 'react-redux'

// ─── Loader ───────────────────────────────────────────────────────────────────

// Barra fija arriba. Vive fuera del router (main.jsx) para verse tambien
// mientras se valida la sesion, antes de montar App.
const Loader = () => {

  const loader = useSelector(state => state.loader);

  if (loader) return null;

  return (
    <div
      role="progressbar"
      aria-label="Cargando"
      className="fixed inset-x-0 top-0 z-[9999] h-0.5 overflow-hidden bg-transparent"
    >
      <div className="h-full w-2/5 animate-[fade-in_0.2s_ease-out] bg-accent">
        <span className="block h-full w-full animate-pulse bg-accent" />
      </div>
    </div>
  )
}

export default Loader
