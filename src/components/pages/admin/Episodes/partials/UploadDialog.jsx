import React from 'react'
import clsx from 'clsx'
import uploads from '../../../../../services/uploads.services'
import { Button, Dialog, Input, Select } from '../../../../material'

// ─── Constants ────────────────────────────────────────────────────────────────

const VIDEO = ['.mkv', '.mp4', '.m4v', '.mov', '.avi', '.webm', '.ts'];
const AUDIO = ['.m4a', '.aac', '.mka', '.mp3', '.flac', '.wav', '.ac3', '.opus', '.ogg'];
const SUBS = ['.srt', '.ass', '.ssa', '.vtt'];

const LANGUAGES = [
  { value: 'sub', label: 'Subtitulado' },
  { value: 'dub', label: 'Doblado' },
];

const ext = (name) => (name.toLowerCase().match(/\.[a-z0-9]+$/) ?? [''])[0];

// "ep01.es.srt" → "es". Si el nombre no lo dice, se pide a mano.
const guessLang = (name) =>
  name.match(/\.([a-z]{2,3}(?:-[A-Za-z0-9]{2,8})?)\.[a-z0-9]+$/i)?.[1]?.toLowerCase() ?? '';

const megabytes = (bytes) => `${(bytes / 1048576).toFixed(bytes > 1.07e9 ? 0 : 1)} MB`;

// ─── UploadDialog ─────────────────────────────────────────────────────────────

// Suelta el video del episodio (y, si quieres, sus subtitulos o audios). El
// navegador lo sube directo al bucket privado y el servicio de conversion lo
// convierte a HLS y lo publica en la carpeta del episodio: aqui no hay que crear
// carpetas ni tocar ffmpeg.
const UploadDialog = ({ episode, open, onClose, onDone, initialFiles = null }) => {

  const input = React.useRef(null);

  const [video, setVideo] = React.useState(null);
  const [extras, setExtras] = React.useState([]);
  const [notice, setNotice] = React.useState(null);
  const [options, setOptions] = React.useState({ server: 'Zenkai', audioLang: 'ja', language: 'sub' });
  const [phase, setPhase] = React.useState('idle'); // idle | uploading
  const [sent, setSent] = React.useState(0);
  const [error, setError] = React.useState(null);
  const [over, setOver] = React.useState(false);

  const uploading = phase === 'uploading';

  const addFiles = React.useCallback((list) => {
    const rejected = [];

    for (const file of Array.from(list ?? [])) {
      const kind = VIDEO.includes(ext(file.name)) ? 'video' : AUDIO.includes(ext(file.name)) ? 'audio' : SUBS.includes(ext(file.name)) ? 'sub' : null;

      if (kind === 'video') setVideo(file);
      else if (kind) setExtras((prev) => [...prev, { id: `${file.name}-${file.size}-${prev.length}`, file, kind, lang: guessLang(file.name) }]);
      else rejected.push(file.name);
    }

    setNotice(rejected.length ? `Formato no admitido: ${rejected.join(', ')}` : null);
  }, []);

  // Archivos soltados sobre la fila del episodio, antes de abrir el dialogo.
  React.useEffect(() => {
    if (open && initialFiles?.length) addFiles(initialFiles);
  }, [open, initialFiles, addFiles]);

  // Una subida a medias se pierde si se cierra o recarga la pestana.
  React.useEffect(() => {
    if (!uploading) return;

    const warn = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [uploading]);

  const reset = () => {
    setVideo(null);
    setExtras([]);
    setNotice(null);
    setError(null);
    setSent(0);
    setPhase('idle');
  };

  const close = () => {
    if (uploading) return;
    reset();
    onClose();
  };

  const setExtraLang = (id) => (event) =>
    setExtras((prev) => prev.map((extra) => (extra.id === id ? { ...extra, lang: event.target.value.trim().toLowerCase() } : extra)));

  const removeExtra = (id) => setExtras((prev) => prev.filter((extra) => extra.id !== id));

  const ready = video && extras.every((extra) => /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$/.test(extra.lang));

  const onSubmit = async () => {
    const files = [video, ...extras.map((extra) => extra.file)];
    const total = files.reduce((sum, file) => sum + file.size, 0);

    let created = null;

    setPhase('uploading');
    setError(null);
    setSent(0);

    try {
      created = await uploads.create(episode.id, {
        filename: video.name,
        size: video.size,
        extras: extras.map((extra) => ({ kind: extra.kind, lang: extra.lang, filename: extra.file.name, size: extra.file.size })),
        options,
      });

      let done = 0;

      for (let index = 0; index < files.length; index += 1) {
        await uploads.put(created.files[index], files[index], (loaded) => setSent(done + loaded));
        done += files[index].size;
        setSent(done);
      }

      await uploads.complete(created.id);

      reset();
      onDone();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message ?? err.message);
      // Si se creo el trabajo pero la subida fallo, no se deja a medias en el servidor.
      if (created) uploads.remove(created.id).catch(() => {});
      setPhase('idle');
    }

    return total;
  };

  const total = (video?.size ?? 0) + extras.reduce((sum, extra) => sum + extra.file.size, 0);
  const percent = total ? Math.min(100, Math.round((sent / total) * 100)) : 0;

  return (
    <Dialog
      open={open}
      onClose={close}
      size="lg"
      title={`Subir video · Episodio ${episode?.number}`}
      actions={
        <>
          <Button color="ghost" size="sm" disabled={uploading} onClick={close}>Cancelar</Button>
          <Button size="sm" disabled={!ready} loading={uploading} onClick={onSubmit}>
            Subir y publicar
          </Button>
        </>
      }
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => !uploading && input.current?.click()}
        onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && !uploading && input.current?.click()}
        onDragOver={(event) => { event.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => { event.preventDefault(); setOver(false); if (!uploading) addFiles(event.dataTransfer.files); }}
        className={clsx(
          'flex cursor-pointer flex-col items-center gap-1 border-2 border-dashed px-4 py-8 text-center transition-colors',
          over ? 'border-accent bg-accent/10' : 'border-line bg-surface-2 hover:border-accent/60',
          uploading && 'pointer-events-none opacity-60',
        )}
      >
        {video ? (
          <>
            <span className="text-sm font-semibold">{video.name}</span>
            <span className="text-xs text-muted">{megabytes(video.size)} · suelta otro para reemplazarlo</span>
          </>
        ) : (
          <>
            <span className="text-sm font-semibold">Suelta aquí el video del episodio</span>
            <span className="text-xs text-muted">o haz clic para elegirlo. Puedes añadir también subtítulos y audios.</span>
          </>
        )}

        <input
          ref={input}
          type="file"
          multiple
          hidden
          accept={[...VIDEO, ...AUDIO, ...SUBS].join(',')}
          onChange={(event) => { addFiles(event.target.files); event.target.value = ''; }}
        />
      </div>

      {notice && <p className="text-xs text-red-400">{notice}</p>}

      {extras.length > 0 && (
        <ul className="flex flex-col gap-2">
          {extras.map((extra) => (
            <li key={extra.id} className="flex items-end gap-2 border border-line bg-surface-2 p-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{extra.file.name}</p>
                <p className="text-[11px] text-muted">{extra.kind === 'sub' ? 'Subtítulos' : 'Audio'} · {megabytes(extra.file.size)}</p>
              </div>

              <div className="w-28">
                <Input full size="sm" name={`lang-${extra.id}`} label="Idioma" placeholder="es" value={extra.lang} onChange={setExtraLang(extra.id)} disabled={uploading} />
              </div>

              <button
                type="button"
                disabled={uploading}
                onClick={() => removeExtra(extra.id)}
                aria-label={`Quitar ${extra.file.name}`}
                className="mb-1 px-2 text-sm text-muted transition-colors hover:bg-red-500/15 hover:text-red-400 disabled:opacity-40"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input full name="server" label="Nombre del servidor" value={options.server} onChange={(event) => setOptions((prev) => ({ ...prev, server: event.target.value }))} disabled={uploading} />
        <Input full name="audioLang" label="Idioma del audio (ja, es…)" value={options.audioLang} onChange={(event) => setOptions((prev) => ({ ...prev, audioLang: event.target.value.trim().toLowerCase() }))} disabled={uploading} />
        <Select full label="Tipo" value={options.language} onChange={(value) => setOptions((prev) => ({ ...prev, language: value }))} data={LANGUAGES} />
      </div>

      {uploading && (
        <div className="flex flex-col gap-1">
          <div className="h-2 w-full bg-surface-2">
            <div className="h-full bg-accent transition-[width] duration-200" style={{ width: `${percent}%` }} />
          </div>
          <p className="text-xs text-muted">
            Subiendo {percent}% · {megabytes(sent)} de {megabytes(total)}. No cierres esta pestaña hasta que termine.
          </p>
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      <p className="text-xs text-muted">
        Al terminar de subir, el servicio de conversión lo procesa en segundo plano: tarda unos minutos y el estado
        aparece en el episodio.
      </p>
    </Dialog>
  )
}

export default UploadDialog
