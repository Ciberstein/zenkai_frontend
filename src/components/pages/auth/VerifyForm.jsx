import React from 'react'
import clsx from 'clsx'
import { Button } from '../../material'
import auth_service from '../../../services/auth.services'
import { spanish } from '../../../utils/auth.util'

const LENGTH = 6;

// ─── VerifyForm ───────────────────────────────────────────────────────────────

// Segundo paso del registro (y del inicio de sesión de una cuenta sin verificar): el código
// de 6 dígitos que llegó por correo. Se envía solo al completar el sexto dígito, acepta
// pegar el código entero y el autocompletado de "código de un solo uso" del móvil. El botón
// de reenviar espera un minuto entre envíos, igual que el servidor.
const VerifyForm = ({ email, sent = true, wait = 0, onBack }) => {

  const input = React.useRef(null);

  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState(null);
  const [notice, setNotice] = React.useState(
    sent ? null : wait > 0 ? 'Ya te enviamos un código hace un momento: revisa tu correo.' : 'No pudimos enviar el correo. Pulsa «Reenviar código» para intentarlo de nuevo.',
  );
  const [loading, setLoading] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [left, setLeft] = React.useState(wait);

  React.useEffect(() => { input.current?.focus() }, []);

  // Cuenta atrás del reenvío.
  React.useEffect(() => {
    if (left <= 0) return;

    const timer = setTimeout(() => setLeft((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);

  const submit = async (value) => {
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      await auth_service.verify({ email, code: value });
      // Recarga completa, como el login: el contexto de sesión se resuelve al montar.
      window.location.assign('/');
    } catch (err) {
      setError(spanish(err.response?.data?.message, 'No se pudo verificar el código'));
      setCode('');
      setLoading(false);
      input.current?.focus();
    }
  };

  const onChange = (event) => {
    const value = event.target.value.replace(/\D/g, '').slice(0, LENGTH);

    setCode(value);
    setError(null);

    if (value.length === LENGTH) submit(value);
  };

  const resend = async () => {
    setResending(true);
    setError(null);

    try {
      const res = await auth_service.resend(email);

      setLeft(res.data?.wait || 60);
      setNotice('Te hemos enviado un código nuevo.');
      setCode('');
      input.current?.focus();
    } catch (err) {
      setError(spanish(err.response?.data?.message, 'No se pudo reenviar el código'));
    } finally {
      setResending(false);
    }
  };

  return (
    <form
      onSubmit={(event) => { event.preventDefault(); if (code.length === LENGTH) submit(code); }}
      className="flex flex-col gap-5"
    >
      {error && (
        <p role="alert" className="border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">
          {error}
        </p>
      )}

      {notice && !error && (
        <p role="status" className="border border-line bg-surface px-4 py-3 text-sm text-muted">{notice}</p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="code" className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          Código de verificación
        </label>

        <input
          ref={input}
          id="code"
          name="code"
          value={code}
          onChange={onChange}
          disabled={loading}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={LENGTH}
          placeholder="••••••"
          aria-invalid={Boolean(error) || undefined}
          className={clsx(
            'h-16 w-full border bg-surface text-center font-mono text-3xl tabular-nums tracking-[0.5em] text-fg',
            'placeholder:text-muted/50 focus-visible:outline-none disabled:opacity-50',
            'transition-colors duration-150',
            error ? 'border-red-500/70 focus:border-red-500' : 'border-line focus:border-accent',
          )}
        />
      </div>

      <Button full size="lg" type="submit" loading={loading} disabled={code.length !== LENGTH}>
        Verificar
      </Button>

      <div className="flex flex-col items-center gap-2 text-sm text-muted">
        <button
          type="button"
          onClick={resend}
          disabled={left > 0 || resending || loading}
          className="cursor-pointer font-semibold text-accent-text hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
        >
          {left > 0 ? `Reenviar código en ${left} s` : 'Reenviar código'}
        </button>

        <button type="button" onClick={onBack} disabled={loading} className="cursor-pointer transition-colors hover:text-fg">
          ← Usar otro correo
        </button>
      </div>
    </form>
  )
}

export default VerifyForm
