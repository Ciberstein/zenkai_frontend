import React from 'react'
import QRCode from 'qrcode'
import { Button } from '../../../../material'
import Brand from '../../../../shared/Brand'
import auth_service from '../../../../../services/auth.services'
import { takeReturn } from '../../../../../utils/returnTo'

const POLL_MS = 3000;
const RETRY_MS = 5000;

// ─── TvLogin ──────────────────────────────────────────────────────────────────

// Inicio de sesion para la TV, sin teclado: muestra un QR y un codigo; el usuario lo autoriza desde
// su celular (ya con sesion) y esta pantalla, que pregunta cada pocos segundos, entra sola.
// El codigo caduca a los 5 minutos y se renueva solo.
const TvLogin = ({ onManual }) => {

  const [pair, setPair] = React.useState(null);
  const [qr, setQr] = React.useState(null);
  const [round, setRound] = React.useState(0);
  const [offline, setOffline] = React.useState(false);

  const address = `${window.location.host}/tv`;

  // Pide un codigo nuevo (al montar, al caducar y tras un fallo de red).
  React.useEffect(() => {
    let live = true;
    let retry;

    setPair(null);
    setQr(null);

    auth_service.tvCode()
      .then((res) => { if (live) { setOffline(false); setPair(res.data); } })
      .catch(() => { if (live) { setOffline(true); retry = setTimeout(() => setRound((n) => n + 1), RETRY_MS); } });

    return () => { live = false; clearTimeout(retry); };
  }, [round]);

  React.useEffect(() => {
    if (!pair) return;

    // Negro sobre blanco y con margen: es lo que mejor leen las camaras de los celulares.
    QRCode.toDataURL(`${window.location.origin}/tv?code=${pair.code}`, { margin: 2, width: 480, errorCorrectionLevel: 'M' })
      .then(setQr)
      .catch(() => setQr(null));
  }, [pair]);

  // Pregunta si ya lo autorizaron.
  React.useEffect(() => {
    if (!pair) return;

    let live = true;

    const timer = setInterval(async () => {
      try {
        const { data } = await auth_service.tvPoll(pair.secret);
        if (!live) return;

        if (data.status === 'approved') {
          live = false;
          clearInterval(timer);
          // Recarga completa, como el login normal: el contexto de sesion se resuelve al montar.
          window.location.assign(takeReturn() ?? '/');
        } else if (data.status === 'expired') {
          live = false;
          clearInterval(timer);
          setRound((n) => n + 1);
        }
      } catch { /* sin red un momento: sigue preguntando */ }
    }, POLL_MS);

    return () => { live = false; clearInterval(timer); };
  }, [pair]);

  const code = pair ? `${pair.code.slice(0, 4)} ${pair.code.slice(4)}` : null;

  return (
    <div className="dark flex min-h-screen items-center justify-center bg-bg px-[6vw] py-10 text-fg">
      <div className="grid w-full max-w-6xl items-center gap-16 lg:grid-cols-[1.1fr_1fr]">

        <div className="flex flex-col gap-8">
          <Brand name="Zenkai" />

          <h1 className="font-display-tight text-5xl font-bold">Inicia sesión desde tu celular</h1>

          <ol className="flex flex-col gap-4 text-lg text-fg/80">
            <li><span className="mr-3 font-mono text-accent-text">01</span>Escanea el código QR con la cámara.</li>
            <li>
              <span className="mr-3 font-mono text-accent-text">02</span>
              ¿Sin cámara? Entra a <strong className="text-fg">{address}</strong> e introduce el código.
            </li>
            <li><span className="mr-3 font-mono text-accent-text">03</span>Inicia sesión si hace falta y pulsa «Autorizar».</li>
          </ol>

          <div>
            <Button size="lg" color="outline" onClick={onManual} autoFocus>
              Usar correo y contraseña
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="grid size-80 place-items-center bg-white p-1">
            {qr
              ? <img src={qr} alt="Código QR para vincular esta TV" className="size-full" />
              : <p className="px-6 text-center text-sm font-medium text-ink-950">{offline ? 'Sin conexión. Reintentando…' : 'Generando código…'}</p>}
          </div>

          <p className="font-mono text-5xl font-bold tracking-[0.18em] text-accent-text" aria-label={code ? `Código ${pair.code.split('').join(' ')}` : undefined}>
            {code ?? '···· ····'}
          </p>
          <p className="text-sm text-muted">El código caduca en 5 minutos y se renueva solo.</p>
        </div>

      </div>
    </div>
  )
}

export default TvLogin
