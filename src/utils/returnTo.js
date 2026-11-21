// Recordar a dónde volver después de iniciar sesión (o de crear la cuenta y verificar el correo).
// Se guarda en sessionStorage y no en el estado del router porque el camino entre la pantalla de
// acceso y el final puede pasar por varias páginas (login → crear cuenta → código) y recargas.

const KEY = 'zk_return_to';

export const rememberReturn = (path) => {
  try { sessionStorage.setItem(KEY, path); } catch { /* sin storage */ }
};

// Devuelve el destino guardado y lo borra. Solo rutas internas ("/watch/1/2"), nunca una URL
// externa ni "//otro-sitio": sería una redirección abierta.
export const takeReturn = () => {
  try {
    const path = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);

    return path && /^\/(?!\/)/.test(path) ? path : null;
  } catch {
    return null;
  }
};
