import React from 'react'

// ─── PageHeader ───────────────────────────────────────────────────────────────

// Cabecera comun de las pantallas de exploracion: etiqueta, titular grande y
// a la derecha los controles de la pantalla. Un solo sitio para que todas
// compartan escala y ritmo vertical.
const PageHeader = ({ eyebrow = null, title, description = null, children = null }) => (
  <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
    <div className="flex min-w-0 flex-col gap-2">
      {eyebrow && (
        <p className="eyebrow">{eyebrow}</p>
      )}
      <h1 className="font-display-tight text-[clamp(2rem,4.5vw,3.5rem)] font-bold">{title}</h1>
      {description && <p className="max-w-xl text-[15px] text-muted">{description}</p>}
    </div>

    {children && <div className="flex flex-wrap items-end gap-3">{children}</div>}
  </header>
)

export default PageHeader
