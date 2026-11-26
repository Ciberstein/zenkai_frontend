// Modo TV (Samsung Tizen): navegacion con el control remoto, teclas multimedia y foco visible.
// Se activa solo en una TV (user agent "Tizen"/"SMART-TV") o a mano con ?tv=1 (?tv=0 lo apaga).

const param = new URLSearchParams(window.location.search).get('tv')
try {
  if (param === '1') localStorage.setItem('tv', '1')
  if (param === '0') localStorage.removeItem('tv')
} catch { /* sin almacenamiento */ }

export const isTV = (() => {
  if (param === '0') return false
  if (/tizen|smart-?tv|smarttv/i.test(navigator.userAgent)) return true
  try { return localStorage.getItem('tv') === '1' } catch { return false }
})()

// Codigos de tecla del control remoto de Samsung (no tienen `key` util).
const REMOTE = {
  10009: 'back',
  415: 'play',
  19: 'pause',
  10252: 'playpause',
  413: 'stop',
  417: 'forward',
  412: 'rewind',
}

export const remoteKey = (event) => REMOTE[event.keyCode] ?? null

const FOCUSABLE = 'a[href], button, input, select, textarea, summary, [role="button"], [role="slider"], [tabindex]:not([tabindex="-1"])'

const usable = (el) => {
  if (el.disabled || el.getAttribute('aria-hidden') === 'true') return false
  const rect = el.getBoundingClientRect()
  if (rect.width < 2 || rect.height < 2) return false
  const style = getComputedStyle(el)
  return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) > 0.05
}

// Dialogos abiertos: si hay uno, el foco no puede salir de el.
const scopeOf = () => {
  const modals = document.querySelectorAll('[role="dialog"], [aria-modal="true"]')
  return modals.length ? modals[modals.length - 1] : document
}

// Siguiente elemento en la direccion pedida: el mas cercano que este realmente de ese lado,
// penalizando lo desalineado (como la navegacion espacial de las TV).
export const next = (from, direction) => {
  const origin = from.getBoundingClientRect()
  const cx = origin.left + origin.width / 2
  const cy = origin.top + origin.height / 2
  const horizontal = direction === 'left' || direction === 'right'
  let best = null
  let bestScore = Infinity

  scopeOf().querySelectorAll(FOCUSABLE).forEach((el) => {
    if (el === from || el.contains(from) || from.contains(el) || !usable(el)) return

    const rect = el.getBoundingClientRect()
    const dx = rect.left + rect.width / 2 - cx
    const dy = rect.top + rect.height / 2 - cy

    const forward = { right: dx, left: -dx, down: dy, up: -dy }[direction]
    // Debe quedar delante: su borde cercano pasa del borde de salida (con 4 px de tolerancia).
    const edge = {
      right: rect.left - origin.right,
      left: origin.left - rect.right,
      down: rect.top - origin.bottom,
      up: origin.top - rect.bottom,
    }[direction]
    if (forward <= 0 || edge < -4) return

    const across = horizontal ? Math.abs(dy) : Math.abs(dx)
    const overlap = horizontal
      ? Math.min(rect.bottom, origin.bottom) - Math.max(rect.top, origin.top)
      : Math.min(rect.right, origin.right) - Math.max(rect.left, origin.left)
    const score = Math.max(edge, 0) + across * 2.5 - (overlap > 0 ? Math.min(overlap, 120) : 0)

    if (score < bestScore) { best = el; bestScore = score }
  })

  return best
}

const focusOn = (el) => {
  el.focus({ preventScroll: true })
  el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' })
}

const textual = (el) =>
  el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && !['range', 'checkbox', 'radio', 'button', 'submit'].includes(el.type))

const exitApp = () => {
  try { window.tizen?.application.getCurrentApplication().exit() } catch { /* fuera de una TV */ }
}

const onKey = (event) => {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return

  // Atras: sale de dialogos o del reproductor; en la pantalla de inicio cierra la app.
  if (event.keyCode === 10009 || event.key === 'XF86Back') {
    event.preventDefault()
    if (window.location.pathname === '/') exitApp()
    else window.history.back()
    return
  }

  const direction = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[event.key]
  if (!direction) return

  const active = document.activeElement
  const typing = active && textual(active)

  // En un campo de texto izquierda/derecha mueven el cursor; arriba/abajo si salen de el.
  if (typing && (direction === 'left' || direction === 'right')) return
  // Un deslizador (volumen, progreso) usa izquierda/derecha para cambiar de valor.
  if (active?.type === 'range' && (direction === 'left' || direction === 'right')) return

  event.preventDefault()

  if (!active || active === document.body || active === document.documentElement) {
    const first = scopeOf().querySelector(FOCUSABLE)
    const all = [...scopeOf().querySelectorAll(FOCUSABLE)].filter(usable)
    const start = all.sort((a, b) => {
      const ra = a.getBoundingClientRect()
      const rb = b.getBoundingClientRect()
      return (ra.top + ra.left * 0.1) - (rb.top + rb.left * 0.1)
    })[0] ?? first
    if (start) focusOn(start)
    return
  }

  const target = next(active, direction)
  if (target) focusOn(target)
}

export const setup = () => {
  if (!isTV) return

  document.documentElement.classList.add('tv')

  // Pide al sistema las teclas multimedia (por defecto el control no las envia a la app).
  try {
    ;['MediaPlay', 'MediaPause', 'MediaPlayPause', 'MediaStop', 'MediaFastForward', 'MediaRewind']
      .forEach((name) => window.tizen?.tvinputdevice.registerKey(name))
  } catch { /* fuera de una TV */ }

  window.addEventListener('keydown', onKey)
}
