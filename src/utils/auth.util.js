// El servidor responde en inglés; las pantallas de código muestran estos mensajes en español.
export const spanish = (message, fallback) => {
  const left = /Incorrect code, (\d+) attempt/.exec(message ?? '');

  if (left) return `Código incorrecto. Te quedan ${left[1]} intentos.`;
  if (/Incorrect code/.test(message ?? '')) return 'Código incorrecto. Pide uno nuevo.';
  if (/expired/.test(message ?? '')) return 'El código ha caducado. Pide uno nuevo.';
  if (/Too many attempts/.test(message ?? '')) return 'Demasiados intentos. Pide un código nuevo.';
  if (/Too many requests/.test(message ?? '')) return 'Demasiadas peticiones. Espera unos minutos.';
  if (/recovery is not available/.test(message ?? '')) return 'La recuperación de contraseña no está disponible ahora mismo.';
  if (/Password must be/.test(message ?? '')) return 'Mínimo 8 caracteres con mayúscula, minúscula y número.';

  return message ?? fallback;
};
