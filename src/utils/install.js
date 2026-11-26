// Instalacion como app (PWA): guarda el aviso del navegador para lanzarlo desde un boton.
let deferred = null
const listeners = new Set()
const emit = () => listeners.forEach((fn) => fn())

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

export const canInstall = () => Boolean(deferred)

export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn) }

export const install = async () => {
  if (!deferred) return false
  deferred.prompt()
  const { outcome } = await deferred.userChoice
  deferred = null
  emit()
  return outcome === 'accepted'
}

export const setup = () => {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; emit() })
  window.addEventListener('appinstalled', () => { deferred = null; emit() })
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
  }
}
