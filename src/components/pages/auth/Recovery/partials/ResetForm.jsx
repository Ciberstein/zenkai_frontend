import React from 'react'
import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Button, Input } from '../../../../material'
import auth_service from '../../../../../services/auth.services'
import { spanish } from '../../../../../utils/auth.util'

const LENGTH = 6;

// Paso 2 de la recuperación: el código que llegó por correo y la contraseña nueva. Al terminar
// se vuelve al login (las sesiones abiertas se cierran en el servidor).
const ResetForm = ({ email, wait = 0, onBack }) => {

  const navigate = useNavigate();
  const input = React.useRef(null);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();

  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState(null);
  const [notice, setNotice] = React.useState(null);
  const [resending, setResending] = React.useState(false);
  const [left, setLeft] = React.useState(wait);

  React.useEffect(() => { input.current?.focus() }, []);

  React.useEffect(() => {
    if (left <= 0) return;

    const timer = setTimeout(() => setLeft((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);

  const onSubmit = async ({ password }) => {
    setError(null);
    setNotice(null);

    try {
      await auth_service.reset({ email, code, password });
      navigate('/login', { replace: true, state: { notice: 'Contraseña actualizada. Inicia sesión con la nueva.' } });
    } catch (err) {
      setError(spanish(err.response?.data?.message, 'No se pudo cambiar la contraseña'));
      setCode('');
      input.current?.focus();
    }
  };

  const resend = async () => {
    setResending(true);
    setError(null);

    try {
      const res = await auth_service.recover(email);

      setLeft(res.data?.wait || 60);
      setNotice('Si la cuenta existe, te hemos enviado un código nuevo.');
      setCode('');
      input.current?.focus();
    } catch (err) {
      setError(spanish(err.response?.data?.message, 'No se pudo reenviar el código'));
    } finally {
      setResending(false);
    }
  };

  const field = (rules) => ({ function: register, errors: { function: errors, rules } });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
          Código del correo
        </label>

        <input
          ref={input}
          id="code"
          name="code"
          value={code}
          onChange={(event) => { setCode(event.target.value.replace(/\D/g, '').slice(0, LENGTH)); setError(null); }}
          disabled={isSubmitting}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={LENGTH}
          placeholder="••••••"
          className={clsx(
            'h-14 w-full border bg-surface text-center font-mono text-2xl tabular-nums tracking-[0.5em] text-fg',
            'placeholder:text-muted/50 focus-visible:outline-none disabled:opacity-50 transition-colors duration-150',
            'border-line focus:border-accent',
          )}
        />
      </div>

      <Input
        full
        type="password"
        name="password"
        label="Contraseña nueva"
        autoComplete="new-password"
        register={field({
          required: 'Campo obligatorio',
          pattern: {
            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
            message: 'Mínimo 8 caracteres con mayúscula, minúscula y número',
          },
        })}
      />

      <Input
        full
        type="password"
        name="confirm"
        label="Repetir contraseña"
        autoComplete="new-password"
        register={field({
          validate: (value) => value === watch('password') || 'Las contraseñas no coinciden',
        })}
      />

      <Button full size="lg" type="submit" loading={isSubmitting} disabled={code.length !== LENGTH}>
        Cambiar contraseña
      </Button>

      <div className="flex flex-col items-center gap-2 text-sm text-muted">
        <button
          type="button"
          onClick={resend}
          disabled={left > 0 || resending || isSubmitting}
          className="cursor-pointer font-semibold text-accent-text hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
        >
          {left > 0 ? `Reenviar código en ${left} s` : 'Reenviar código'}
        </button>

        <button type="button" onClick={onBack} disabled={isSubmitting} className="cursor-pointer transition-colors hover:text-fg">
          ← Usar otro correo
        </button>
      </div>
    </form>
  )
}

export default ResetForm
