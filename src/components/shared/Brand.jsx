import React from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

// ─── Brand ────────────────────────────────────────────────────────────────────

// Sello + palabra. El sello es una placa amarilla con la esquina cortada y la
// Z de un solo trazo (la misma del favicon); "全開" va en pequeno al lado: es lo
// que significa el nombre, "a plena potencia". Al pasar el cursor, el nombre
// parpadea con una interferencia de canal.
export const Brand = ({ name = 'Zenkai', className = '', kanji = true, to = '/' }) => (
  <Link
    to={to}
    aria-label={name}
    className={clsx('group inline-flex items-center gap-3', className)}
  >
    <span className="cut-sm grid size-9 place-items-center bg-accent">
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="#07070a" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
        <path d="M6 6h12L7 18h12" />
      </svg>
    </span>

    <span className="font-display text-[22px] font-bold uppercase leading-none tracking-[0.14em] group-hover:animate-glitch">
      {name}
    </span>

    {kanji && (
      <span aria-hidden="true" className="hidden font-jp text-[11px] font-bold leading-none tracking-[0.2em] text-accent-text lg:inline">
        全開
      </span>
    )}
  </Link>
)

export default Brand
