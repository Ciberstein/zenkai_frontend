// Segundos -> "12:34" o "1:02:33". Se usa en el reproductor y en las tarjetas
// de "continuar viendo", por eso omite la hora cuando no hace falta.
const formatTime = (seconds = 0) => {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  const pad = (value) => String(value).padStart(2, '0');

  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

export default formatTime;
