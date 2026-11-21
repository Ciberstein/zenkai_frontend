import React from 'react'
import Cropper from 'react-easy-crop'
import { useDispatch, useSelector } from 'react-redux'
import { setProfile } from '../../../../../store/slices/account.slice'
import { API_ROUTES } from '../../../../../api/routes'
import api from '../../../../../api/axios'
import { Button, Dialog } from '../../../../material'
import Avatar from '../../../../shared/Avatar'

// ─── Constantes ───────────────────────────────────────────────────────────────

const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_ORIGINAL = 20 * 1024 * 1024;   // la original puede ser grande: lo que se sube es el recorte
const SIZE = 512;                         // lado máximo del recorte que se sube

// ─── Recorte ──────────────────────────────────────────────────────────────────

// Dibuja en un canvas la zona elegida (en píxeles de la imagen original), reducida a 512 px de
// lado como mucho, y la devuelve como JPEG. El fondo blanco evita que un PNG transparente salga negro.
const cropToBlob = (src, area) => new Promise((resolve, reject) => {
  const image = new Image();

  image.onload = () => {
    const side = Math.min(area.width, SIZE);
    const canvas = document.createElement('canvas');

    canvas.width = side;
    canvas.height = side;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, side, side);
    ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, side, side);

    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No se pudo recortar la imagen'))), 'image/jpeg', 0.9);
  };

  image.onerror = () => reject(new Error('No se pudo leer la imagen'));
  image.src = src;
});

const spanish = (message) =>
  /not configured/i.test(message ?? '') ? 'Las subidas de imagen no están configuradas en el servidor.'
    : /exceed/i.test(message ?? '') ? 'La imagen pesa demasiado (máximo 5 MB).'
      : /JPEG, PNG or WebP/i.test(message ?? '') ? 'Usa una imagen JPEG, PNG o WebP.'
        : message;

// ─── CropDialog ───────────────────────────────────────────────────────────────

const CropDialog = ({ src, saving, onCancel, onConfirm }) => {

  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [area, setArea] = React.useState(null);

  return (
    <Dialog
      open
      onClose={() => !saving && onCancel()}
      size="md"
      title="Recortar foto"
      actions={
        <>
          <Button color="ghost" size="sm" disabled={saving} onClick={onCancel}>Cancelar</Button>
          <Button size="sm" disabled={!area} loading={saving} onClick={() => onConfirm(area)}>Usar foto</Button>
        </>
      }
    >
      <div className="relative h-72 w-full overflow-hidden bg-black">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={1}
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, pixels) => setArea(pixels)}
        />
      </div>

      <label className="flex items-center gap-3 text-xs text-muted">
        <span className="font-mono uppercase tracking-[0.14em]">Zoom</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          disabled={saving}
          onChange={(event) => setZoom(Number(event.target.value))}
          className="w-full accent-(--accent)"
        />
      </label>
    </Dialog>
  )
}

// ─── AvatarUploader ───────────────────────────────────────────────────────────

// Foto de perfil: se elige una imagen, se recorta en cuadrado con zoom y se sube al instante
// (el servidor la guarda en Cloudinary y borra la anterior).
const AvatarUploader = () => {

  const account = useSelector((state) => state.account);
  const dispatch = useDispatch();
  const input = React.useRef(null);

  const [source, setSource] = React.useState(null);   // URL local de la imagen elegida
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);

  const avatar = account?.profile?.avatar ?? null;

  const close = () => {
    if (source) URL.revokeObjectURL(source);
    setSource(null);
  };

  const pick = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!ACCEPT.split(',').includes(file.type)) return setError('Usa una imagen JPEG, PNG o WebP.');
    if (file.size > MAX_ORIGINAL) return setError('La imagen es demasiado grande (máximo 20 MB).');

    setError(null);
    setSource(URL.createObjectURL(file));
  };

  const upload = async (area) => {
    setSaving(true);
    setError(null);

    try {
      const blob = await cropToBlob(source, area);
      const body = new FormData();

      body.append('avatar', new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));

      const res = await api.post(`${API_ROUTES.USER}/profile/avatar`, body, { headers: { 'Content-Type': 'multipart/form-data' } });

      dispatch(setProfile(res.data));
      close();
    } catch (err) {
      setError(spanish(err.response?.data?.message ?? err.message));
      close();
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await api.delete(`${API_ROUTES.USER}/profile/avatar`);
      dispatch(setProfile(res.data));
    } catch (err) {
      setError(spanish(err.response?.data?.message ?? err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-5">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={saving}
        aria-label="Cambiar foto de perfil"
        className="group relative cursor-pointer outline-none disabled:cursor-wait"
      >
        <Avatar src={avatar} name={account?.username} size="size-24" className="text-4xl" />

        <span className="cut-sm absolute inset-0 grid place-items-center bg-black/60 text-xs font-bold uppercase tracking-[0.12em] text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          Cambiar
        </span>
      </button>

      <div className="flex flex-col items-start gap-2">
        <div className="flex gap-2">
          <Button type="button" size="sm" color="soft" loading={saving && !source} onClick={() => input.current?.click()}>
            {avatar ? 'Cambiar foto' : 'Subir foto'}
          </Button>

          {avatar && <Button type="button" size="sm" color="ghost" disabled={saving} onClick={remove}>Quitar</Button>}
        </div>

        <p className="text-xs text-muted">JPEG, PNG o WebP. Se recorta en cuadrado.</p>
        {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
      </div>

      <input ref={input} type="file" hidden accept={ACCEPT} onChange={pick} />

      {source && <CropDialog src={source} saving={saving} onCancel={close} onConfirm={upload} />}
    </div>
  )
}

export default AvatarUploader
