import React from 'react'
import clsx from 'clsx'
import Icon from '../../../../shared/Icon'

// ─── PartyPanel ───────────────────────────────────────────────────────────────

// Panel lateral de la sala de "ver juntos": quien esta, el chat y el enlace para invitar.
// Se pinta dentro del reproductor para que siga a la vista en pantalla completa.
const PartyPanel = ({ party, link, onClose, onLeave }) => {

  const [text, setText] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const list = React.useRef(null);

  const members = party.room?.members ?? [];

  React.useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [party.chat.length]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copia el enlace de la sala', link);
    }
  };

  const submit = (event) => {
    event.preventDefault();

    const value = text.trim();
    if (!value) return;

    party.send(value);
    setText('');
  };

  return (
    <aside
      aria-label="Sala para ver juntos"
      className="absolute bottom-32 right-0 top-20 z-30 flex w-80 max-w-[88vw] flex-col bg-black/88 text-white backdrop-blur-md sm:bottom-44 sm:right-6 sm:top-24"
    >
      <header className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
        <Icon name="users" className="size-5 text-accent" />

        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Ver juntos</p>
          <p className="truncate font-mono text-sm font-semibold tracking-[0.2em]">{party.code}</p>
        </div>

        <button type="button" onClick={onClose} aria-label="Cerrar el panel" className="grid size-8 cursor-pointer place-items-center rounded-full text-white/80 hover:bg-white/12 hover:text-accent">
          <Icon name="x" className="size-5" />
        </button>
      </header>

      <div className="flex flex-col gap-2 border-b border-white/10 px-3 py-2.5">
        <div className="flex gap-2">
          <button type="button" onClick={copy} className="flex-1 cursor-pointer bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg transition-opacity hover:opacity-90">
            {copied ? '¡Enlace copiado!' : 'Copiar enlace'}
          </button>
          <button type="button" onClick={onLeave} className="cursor-pointer border border-white/20 px-3 py-1.5 text-xs text-white/80 transition-colors hover:border-red-400/60 hover:text-red-300">
            Salir
          </button>
        </div>

        {party.status === 'connecting' && <p className="text-xs text-amber-300">Conectando con la sala…</p>}
        {party.status === 'error' && <p className="text-xs text-red-400">{party.error}</p>}

        <ul className="flex flex-wrap gap-1.5" aria-label="Miembros">
          {members.map((member) => (
            <li key={member.id} className={clsx('flex items-center gap-1 bg-white/10 px-2 py-0.5 text-xs', member.id === party.youId && 'ring-1 ring-accent/60')}>
              {member.username}
              {member.id === party.room?.hostId && <span className="text-[10px] text-accent" title="Anfitrión">★</span>}
            </li>
          ))}
        </ul>
      </div>

      <ul ref={list} className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain px-3 py-2.5 text-sm">
        {party.chat.length === 0 && <li className="text-xs text-white/45">Nadie ha escrito todavía.</li>}

        {party.chat.map((message) => (
          message.system
            ? <li key={message.id} className="text-center text-[11px] italic text-white/40">{message.text}</li>
            : (
              <li key={message.id} className="wrap-break-word">
                <span className={clsx('font-semibold', message.userId === party.youId ? 'text-accent' : 'text-white/90')}>{message.username}</span>
                <span className="text-white/80"> {message.text}</span>
              </li>
            )
        ))}
      </ul>

      <form onSubmit={submit} className="flex gap-2 border-t border-white/10 p-2.5">
        <input
          value={text}
          maxLength={300}
          placeholder="Escribe un mensaje"
          aria-label="Mensaje"
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => event.key === 'Escape' && onClose()}
          className="h-9 min-w-0 flex-1 border border-white/15 bg-white/8 px-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-accent"
        />
        <button type="submit" aria-label="Enviar" disabled={!text.trim()} className="grid size-9 shrink-0 cursor-pointer place-items-center bg-accent text-accent-fg disabled:opacity-40">
          <Icon name="send" className="size-4" />
        </button>
      </form>
    </aside>
  )
}

export default PartyPanel
