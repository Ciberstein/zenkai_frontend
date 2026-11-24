import React from 'react'
import clsx from 'clsx'
import uploads from '../../../../../services/uploads.services'
import { Button, Dialog, Input } from '../../../../material'

// ─── Constantes ───────────────────────────────────────────────────────────────

const ACCEPT = ['.m4a', '.aac', '.mka', '.mp3', '.flac', '.wav', '.ac3', '.opus', '.ogg', '.mkv', '.mp4', '.m4v', '.mov', '.avi', '.webm', '.ts'];
const LANG = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$/;

const ext = (name) => (name.toLowerCase().match(/\.[a-z0-9]+$/) ?? [''])[0];

// "ep01.es-419.m4a" → "es-419". Si el nombre no lo dice, se escribe a mano.
const guessLang = (name) =>
  name.match(/\.([a-z]{2,3}(?:-[A-Za-z0-9]{2,8})?)\.[a-z0-9]+$/i)?.[1]?.toLowerCase() ?? null;

const megabytes = (bytes) => (bytes < 1048576 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1048576).toFixed(1)} MB`);

// ─── AudioDialog ──────────────────────────────────────────────────────────────

// Añade otro audio (por ejemplo, otro doblaje) a un episodio ya publicado sin volver a subir
// el video: el navegador sube solo el audio al bucket privado y el servicio de conversion lo
// suma al episodio. Si ya habia un audio de ese idioma, se reemplaza.
const AudioDialog = ({ episode, open, onClose, onDone }) => {

  const input = React.useRef(null);

  const [file, setFile] = React.useState(null);
  const [language, setLanguage] = React.useState('');
  const [offset, setOffset] = React.useState('0');
  const [track, setTrack] = React.useState('');
  const [sent, setSent] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [over, setOver] = React.useState(false);

  const offsetMs = Number(offset);
  const validOffset = offset.trim() !== '' && Number.isInteger(offsetMs) && Math.abs(offsetMs) <= 60000;
  const trackNumber = Number(track);
  const validTrack = track.trim() === '' || (/^\d+$/.test(track.trim()) && trackNumber >= 1 && trackNumber <= 64);
  const ready = file && LANG.test(language) && validOffset && validTrack;

  const pick = (list) => {
    const chosen = Array.from(list ?? [])[0];
    if (!chosen) return;

    if (!ACCEPT.includes(ext(chosen.name))) {
      setError('Formato no admitido: usa un archivo de audio (.m4a, .mp3, .flac…) o un video con la pista de audio');
      return;
    }

    setError(null);
    setFile(chosen);

    const guess = guessLang(chosen.name);
    if (guess) setLanguage(guess);
  };

  const reset = () => {
    setFile(null);
    setLanguage('');
    setOffset('0');
    setTrack('');
    setSent(0);
    setError(null);
  };

  const close = () => {
    if (saving) return;
    reset();
    onClose();
  };

  // Una subida a medias se pierde si se cierra o recarga la pestaña.
  React.useEffect(() => {
    if (!saving) return;

    const warn = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [saving]);

  const onSubmit = async () => {
    let created = null;

    setSaving(true);
    setError(null);
    setSent(0);

    try {
      created = await uploads.createAudio(episode.id, { filename: file.name, size: file.size, language, offset: offsetMs, ...(track.trim() ? { track: trackNumber } : {}) });
      await uploads.put(created.files[0].url, file, setSent);
      await uploads.complete(created.id);

      reset();
      onDone();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message ?? err.message);
      // Si se creo el trabajo pero la subida fallo, no se deja a medias en el servidor.
      if (created) uploads.remove(created.id).catch(() => {});
    } finally {
      setSaving(false);
    }
  };

  const percent = file ? Math.min(100, Math.round((sent / file.size) * 100)) : 0;

  return (
    <Dialog
      open={open}
      onClose={close}
      size="lg"
      title={`Añadir audio · Episodio ${episode?.number}`}
      actions={
        <>
          <Button color="ghost" size="sm" disabled={saving} onClick={close}>Cancelar</Button>
          <Button size="sm" disabled={!ready} loading={saving} onClick={onSubmit}>
            Subir y añadir
          </Button>
        </>
      }
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => !saving && input.current?.click()}
        onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && !saving && input.current?.click()}
        onDragOver={(event) => { event.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => { event.preventDefault(); setOver(false); if (!saving) pick(event.dataTransfer.files); }}
        className={clsx(
          'flex cursor-pointer flex-col items-center gap-1 border-2 border-dashed px-4 py-7 text-center transition-colors',
          over ? 'border-accent bg-accent/10' : 'border-line bg-surface-2 hover:border-accent/60',
          saving && 'pointer-events-none opacity-60',
        )}
      >
        {file ? (
          <>
            <span className="text-sm font-semibold">{file.name}</span>
            <span className="text-xs text-muted">{megabytes(file.size)} · suelta otro para reemplazarlo</span>
          </>
        ) : (
          <>
            <span className="text-sm font-semibold">Suelta aquí el audio del doblaje</span>
            <span className="text-xs text-muted">o haz clic para elegirlo · audio o video con su pista de audio</span>
          </>
        )}

        <input
          ref={input}
          type="file"
          hidden
          accept={ACCEPT.join(',')}
          onChange={(event) => { pick(event.target.files); event.target.value = ''; }}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Input
            full
            name="language"
            label="Idioma"
            placeholder="es-419"
            value={language}
            onChange={(event) => setLanguage(event.target.value.trim().toLowerCase())}
            disabled={saving}
          />
          <p className="text-xs text-muted">Código del idioma: es, es-419, en, ja…</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Input
            full
            name="track"
            label="Pista"
            placeholder="Auto"
            inputMode="numeric"
            value={track}
            onChange={(event) => setTrack(event.target.value.trim())}
            disabled={saving}
          />
          <p className="text-xs text-muted">Opcional. Sin número se elige la del idioma, o la primera.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Input
            full
            name="offset"
            label="Desfase (ms)"
            inputMode="numeric"
            value={offset}
            onChange={(event) => setOffset(event.target.value.trim())}
            disabled={saving}
          />
          <p className="text-xs text-muted">Opcional. Positivo retrasa el audio, negativo lo adelanta.</p>
        </div>
      </div>

      {saving && (
        <div className="flex flex-col gap-1" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-1.5 bg-surface-2"><div className="h-full bg-accent transition-[width]" style={{ width: `${percent}%` }} /></div>
          <span className="text-xs text-muted">Subiendo {percent}%</span>
        </div>
      )}

      {!validTrack && <p className="text-xs text-red-400">La pista es un número entero desde 1, o déjala vacía para elegirla sola.</p>}
      {offset.trim() !== '' && !validOffset && <p className="text-xs text-red-400">El desfase es un número entero de milisegundos, entre -60000 y 60000.</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}

      <p className="text-xs text-muted">
        El audio se convierte en segundo plano y aparece en el selector de audio del reproductor. Si el episodio ya tiene
        un audio en ese idioma, se reemplaza.
      </p>
    </Dialog>
  )
}

export default AudioDialog
