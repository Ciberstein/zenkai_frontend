import React from 'react'
import Icon from '../../../../shared/Icon'

// Atajos del reproductor. Es solo la guía: la lógica de cada tecla vive en PlayerControls (onKey);
// si se añade o cambia una allí, hay que reflejarlo aquí.
const GROUPS = [
  {
    title: 'Reproducción',
    items: [
      { keys: ['Espacio', 'K'], label: 'Reproducir / pausa' },
      { keys: ['J', 'L'], label: 'Retroceder / adelantar 10 s' },
      { keys: ['←', '→'], label: 'Retroceder / adelantar 5 s' },
      { keys: ['0 – 9'], label: 'Ir al 0 – 90 % del video' },
      { keys: ['Inicio', 'Fin'], label: 'Ir al principio / al final' },
      { keys: ['<', '>'], label: 'Bajar / subir la velocidad' },
    ],
  },
  {
    title: 'Sonido y subtítulos',
    items: [
      { keys: ['↑', '↓'], label: 'Subir / bajar el volumen' },
      { keys: ['M'], label: 'Silenciar' },
      { keys: ['C'], label: 'Activar / desactivar subtítulos' },
      { keys: ['A'], label: 'Cambiar de pista de audio' },
    ],
  },
  {
    title: 'Episodios y pantalla',
    items: [
      { keys: ['N', 'P'], label: 'Siguiente / anterior episodio' },
      { keys: ['S'], label: 'Saltar intro, resumen o créditos' },
      { keys: ['O'], label: 'Salto automático de intros' },
      { keys: ['F'], label: 'Pantalla completa' },
      { keys: ['I'], label: 'Pantalla sobre pantalla', pip: true },
      { keys: ['?'], label: 'Mostrar u ocultar esta guía' },
    ],
  },
]

const Key = ({ children }) => (
  <kbd className="grid h-7 min-w-7 place-items-center border border-white/25 bg-white/10 px-1.5 font-mono text-xs text-white">
    {children}
  </kbd>
)

const ShortcutsGuide = ({ onClose, canPip = true }) => {

  const close = React.useRef(null);

  React.useEffect(() => { close.current?.focus(); }, []);

  return (
    <div
      className="absolute inset-0 z-30 grid place-items-center bg-black/65 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Atajos de teclado"
        onClick={(event) => event.stopPropagation()}
        className="cut relative max-h-full w-full max-w-3xl overflow-y-auto bg-black/92 p-5 text-white sm:p-7"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-bold uppercase tracking-[0.1em]">Atajos de teclado</h2>

          <button
            ref={close}
            type="button"
            onClick={onClose}
            aria-label="Cerrar la guía (Esc)"
            className="grid size-9 shrink-0 cursor-pointer place-items-center text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Icon name="x" className="size-5" />
          </button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {GROUPS.map((group) => (
            <section key={group.title} className="flex flex-col gap-3">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/45">{group.title}</h3>

              <ul className="flex flex-col gap-2.5">
                {group.items.filter((item) => canPip || !item.pip).map((item) => (
                  <li key={item.label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-white/85">{item.label}</span>

                    <span className="flex shrink-0 items-center gap-1">
                      {item.keys.map((key) => <Key key={key}>{key}</Key>)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ShortcutsGuide
