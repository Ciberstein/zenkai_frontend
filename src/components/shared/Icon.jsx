import React from 'react'

// ─── Icon ─────────────────────────────────────────────────────────────────────

// Un solo set, mismo trazo (1.75) y misma caja (24): los iconos sueltos de cada
// pantalla acaban con pesos distintos y se nota. Los rellenos (play, star) son
// la excepcion a proposito: son formas solidas.
const PATHS = {
  home: <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1v-8.5Z" />,
  grid: <path d="M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6zM13.5 13.5h6v6h-6z" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
  calendar: <><rect x="4" y="5.5" width="16" height="14.5" rx="2.5" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></>,
  user: <><circle cx="12" cy="8.5" r="3.75" /><path d="M4.75 20c.6-3.4 3.4-5.25 7.25-5.25s6.65 1.85 7.25 5.25" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  fullscreen: <path d="M4.5 9V4.5H9M15 4.5h4.5V9M19.5 15v4.5H15M9 19.5H4.5V15" />,
  'fullscreen-exit': <path d="M9 4.5V9H4.5M15 4.5V9h4.5M19.5 15H15v4.5M4.5 15H9v4.5" />,
  'rewind-10': <><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.8v3.4h3.4" /><text x="12" y="15.3" textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor" stroke="none">10</text></>,
  'forward-10': <><path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.8v3.4h-3.4" /><text x="12" y="15.3" textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor" stroke="none">10</text></>,
  volume: <><path d="M4 9.5v5h3.5l4.5 3.5V6L7.5 9.5H4Z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" /></>,
  'volume-low': <><path d="M4 9.5v5h3.5l4.5 3.5V6L7.5 9.5H4Z" /><path d="M15.5 9a4 4 0 0 1 0 6" /></>,
  'volume-mute': <><path d="M4 9.5v5h3.5l4.5 3.5V6L7.5 9.5H4Z" /><path d="m16 9.5 5 5M21 9.5l-5 5" /></>,
  captions: <><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="M10.2 10.4a2 2 0 0 0-3.2.6v2a2 2 0 0 0 3.2.6M17.2 10.4a2 2 0 0 0-3.2.6v2a2 2 0 0 0 3.2.6" /></>,
  heart: <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20Z" />,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.5M12 7.75v.01" /></>,
  'chevron-left': <path d="m14.5 5.5-6.5 6.5 6.5 6.5" />,
  'chevron-right': <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />,
  'arrow-right': <path d="M5 12h14M13 6l6 6-6 6" />,
  'arrow-left': <path d="M19 12H5M11 6l-6 6 6 6" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" /></>,
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />,
  history: <><path d="M4 12a8 8 0 1 0 2.6-5.9L4 8.5" /><path d="M4 4v4.5h4.5M12 8v4.5l3 2" /></>,
  list: <path d="M8.5 6.5H20M8.5 12H20M8.5 17.5H20M4 6.5h.01M4 12h.01M4 17.5h.01" />,
  settings: <><path d="M10.45 5.28L10.71 2.79L13.29 2.79L13.55 5.28A6.9 6.9 0 0 1 15.66 6.15L17.6 4.57L19.43 6.4L17.85 8.34A6.9 6.9 0 0 1 18.72 10.45L21.21 10.71L21.21 13.29L18.72 13.55A6.9 6.9 0 0 1 17.85 15.66L19.43 17.6L17.6 19.43L15.66 17.85A6.9 6.9 0 0 1 13.55 18.72L13.29 21.21L10.71 21.21L10.45 18.72A6.9 6.9 0 0 1 8.34 17.85L6.4 19.43L4.57 17.6L6.15 15.66A6.9 6.9 0 0 1 5.28 13.55L2.79 13.29L2.79 10.71L5.28 10.45A6.9 6.9 0 0 1 6.15 8.34L4.57 6.4L6.4 4.57L8.34 6.15A6.9 6.9 0 0 1 10.45 5.28Z" /><circle cx="12" cy="12" r="2.9" /></>,
  logout: <path d="M14 4.5h4.5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H14M10 8l-4 4 4 4M6 12h9.5" />,
  shield: <path d="M12 3.5 5 6v5.5c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6l-7-2.5Z" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
};

const FILLED = {
  play: <path d="M8 5.2v13.6a.6.6 0 0 0 .9.5l11-6.8a.6.6 0 0 0 0-1L8.9 4.7a.6.6 0 0 0-.9.5Z" />,
  star: <path d="m12 3.2 2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.5l6-.8L12 3.2Z" />,
  pause: <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />,
  next: <path d="M6 5.2v13.6a.5.5 0 0 0 .8.4l8.4-6.8a.5.5 0 0 0 0-.8L6.8 4.8a.5.5 0 0 0-.8.4ZM17 5h2.2v14H17z" />,
  previous: <path d="M18 5.2v13.6a.5.5 0 0 1-.8.4l-8.4-6.8a.5.5 0 0 1 0-.8l8.4-6.8a.5.5 0 0 1 .8.4ZM7 5H4.8v14H7z" />,
};

export const Icon = ({ name, className = 'size-5', ...props }) => {
  const filled = FILLED[name];

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {filled ?? PATHS[name]}
    </svg>
  )
}

export default Icon
