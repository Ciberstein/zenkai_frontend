import React from 'react'
import clsx from 'clsx'

// ─── ServerPicker ─────────────────────────────────────────────────────────────

const LANGUAGES = { sub: 'Subtitulado', dub: 'Doblado' };

// Un boton por fuente, agrupadas por idioma. Cuando hay varias calidades del
// mismo servidor se muestran juntas para que el cambio sea de un solo clic.
const ServerPicker = ({ sources = [], selected, onSelect }) => {

  if (sources.length < 2) return null;

  const groups = sources.reduce((acc, source) => {
    (acc[source.language] ??= []).push(source);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-3 px-4 pt-4 lg:px-1">
      {Object.entries(groups).map(([language, items]) => (
        <div key={language} className="flex flex-wrap items-center gap-2">
          <span className="w-28 shrink-0 text-xs font-semibold text-muted">
            {LANGUAGES[language] ?? language}
          </span>

          {items.map((source) => (
            <button
              key={source.id}
              type="button"
              onClick={() => onSelect(source)}
              aria-pressed={selected?.id === source.id}
              className={clsx(
                'cursor-pointer px-4 py-1.5 text-xs font-semibold transition-[background-color,color,transform] duration-200 active:scale-95',
                selected?.id === source.id
                  ? 'bg-fg text-bg'
                  : 'bg-surface-2 text-fg/80 hover:bg-line hover:text-fg',
              )}
            >
              {source.server}
              <span className="ml-1.5 font-normal opacity-60">{source.quality}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

export default ServerPicker
