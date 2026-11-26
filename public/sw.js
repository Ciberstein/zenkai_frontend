// Service worker minimo: hace la app instalable. No guarda nada en cache a proposito
// (sesion por cookies, HLS y API deben ir siempre a la red).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
