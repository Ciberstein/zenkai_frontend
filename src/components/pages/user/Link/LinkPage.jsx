import React from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Input } from '../../../material'
import PageHeader from '../../../shared/PageHeader'
import auth_service from '../../../../services/auth.services'

// ─── LinkPage ─────────────────────────────────────────────────────────────────

// Pantalla del celular para autorizar una TV: llega desde el QR (con el codigo ya puesto) o se
// escribe a mano el que muestra la TV. Exige sesion: la ruta vive entre las privadas.
export const LinkPage = () => {

  const [params] = useSearchParams();
  const [code, setCode] = React.useState(() => (params.get('code') ?? '').toUpperCase());
  const [sending, setSending] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState(null);

  const clean = code.replace(/[^A-Za-z0-9]/g, '');

  const onSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSending(true);

    try {
      await auth_service.tvApprove(clean);
      setDone(true);
    } catch (err) {
      setError(err.response?.status === 404
        ? 'El código no es válido o ya caducó. Comprueba que sea el que muestra la TV.'
        : err.response?.data?.message ?? 'No se pudo vincular la TV');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Tu cuenta"
        title="Vincular TV"
        description="Autoriza el código que muestra la pantalla de inicio de sesión de tu TV: entrará con tu cuenta sin escribir nada."
      />

      {done ? (
        <p role="status" className="max-w-md border border-line bg-surface px-5 py-4 text-[15px] text-fg">
          Listo: tu TV está iniciando sesión. Ya puedes volver a la pantalla.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-4">
          {error && (
            <p role="alert" className="border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">
              {error}
            </p>
          )}

          <Input
            full
            size="xl"
            name="code"
            label="Código de la TV"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={9}
            className="font-mono tracking-[0.2em]"
          />

          <Button full size="lg" type="submit" loading={sending} disabled={clean.length !== 8}>
            Autorizar
          </Button>
        </form>
      )}
    </div>
  )
}
