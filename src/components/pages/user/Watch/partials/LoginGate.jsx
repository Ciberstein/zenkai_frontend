import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '../../../../material'
import Icon from '../../../../shared/Icon'
import { rememberReturn } from '../../../../../utils/returnTo'
import PlayerTopBar from './PlayerTopBar'

// ─── LoginGate ────────────────────────────────────────────────────────────────

// Lo que ve un invitado en lugar del reproductor: la web es pública, ver los episodios no.
// De fondo, la miniatura del episodio (o la portada) oscurecida; al iniciar sesión o crear la
// cuenta se vuelve justo a este episodio.
const LoginGate = ({ seriesTitle, episodeLabel, background = null, onClose }) => {

  const { pathname } = useLocation();

  const remember = () => rememberReturn(pathname);

  return (
    <>
      {background && (
        <img
          src={background}
          alt=""
          className="absolute inset-0 size-full scale-110 object-cover opacity-40 blur-xl"
        />
      )}

      <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-black/80" />

      <PlayerTopBar seriesTitle={seriesTitle} episodeLabel={episodeLabel} onClose={onClose} />

      <div className="absolute inset-0 grid place-items-center px-5">
        <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
          <span className="cut grid size-16 place-items-center bg-accent text-accent-fg">
            <Icon name="lock" className="size-8" />
          </span>

          <div className="flex flex-col gap-2">
            <h1 className="font-display-tight text-3xl font-bold text-white sm:text-4xl">Inicia sesión para ver</h1>
            <p className="text-[15px] text-white/70">
              Ver los episodios es solo para usuarios con cuenta. Es gratis, y al entrar volverás justo aquí.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Button as={Link} to="/login" size="lg" onClick={remember} className="sm:min-w-44">Iniciar sesión</Button>
            <Button as={Link} to="/register" size="lg" color="glass" onClick={remember} className="sm:min-w-44">Crear cuenta</Button>
          </div>
        </div>
      </div>
    </>
  )
}

export default LoginGate
