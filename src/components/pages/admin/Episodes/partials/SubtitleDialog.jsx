import React from 'react'
import clsx from 'clsx'
import { API_ROUTES } from '../../../../../api/routes'
import api from '../../../../../api/axios'
import uploads from '../../../../../services/uploads.services'
import { languageName } from '../../../../../utils/player.util'
import { Button, Dialog, Input, Switch } from '../../../../material'

// ─── Constantes ───────────────────────────────────────────────────────────────

const ACCEPT = ['.ass', '.ssa', '.srt', '.vtt'];

const MODES = [
  { key: 'file', label: 'Subir archivo' },
  { key: 'url', label: 'Desde una URL' },
];

const ext = (name) => (name.toLowerCase().match(/\.[a-z0-9]+$/) ?? [''])[0];

// "ep01.es.ass" → "es". Si el nombre no lo dice, se deja el que hubiera.
const guessLang = (name) =>
  name.match(/\.([a-z]{2,3}(?:-[A-Za-z0-9]{2,8})?)\.[a-z0-9]+$/i)?.[1]?.toLowerCase() ?? null;

const kilobytes = (bytes) => (bytes < 1048576 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1048576).toFixed(1)} MB`);

// ─── SubtitleDialog ───────────────────────────────────────────────────────────

// Dos formas de añadir subtitulos a un episodio:
//   · Subir archivo: .ass, .ssa, .srt o .vtt desde el equipo. Se convierte a WebVTT y se
//     guarda en el bucket, en la carpeta del episodio. (Se pierde el estilo del .ass:
//     colores, posicion, karaoke; quedan como texto.)
//   · Desde una URL: un .vtt que ya esta alojado en otro sitio.
const SubtitleDialog = ({ episode, open, onClose, onSaved }) => {

  const input = React.useRef(null);

  const [mode, setMode] = React.useState('file');
  const [file, setFile] = React.useState(null);
  const [language, setLanguage] = React.useState('es');
  const [label, setLabel] = React.useState('Español');
  const [labelTouched, setLabelTouched] = React.useState(false);
  const [url, setUrl] = React.useState('');
  const [isDefault, setIsDefault] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [over, setOver] = React.useState(false);

  // El nombre que ve el usuario sale del idioma, salvo que lo haya escrito el a mano.
  const changeLanguage = (code) => {
    setLanguage(code);
    if (!labelTouched && /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$/.test(code)) setLabel(languageName(code, code));
  };

  const pick = (list) => {
    const chosen = Array.from(list ?? [])[0];
    if (!chosen) return;

    if (!ACCEPT.includes(ext(chosen.name))) {
      setError(`Formato no admitido: usa ${ACCEPT.join(', ')}`);
      return;
    }

    setError(null);
    setFile(chosen);

    const guess = guessLang(chosen.name);
    if (guess) changeLanguage(guess);
  };

  const reset = () => {
    setFile(null);
    setUrl('');
    setIsDefault(false);
    setError(null);
    setLabelTouched(false);
    setLanguage('es');
    setLabel('Español');
  };

  const close = () => {
    if (saving) return;
    reset();
    onClose();
  };

  const ready = language && label && (mode === 'file' ? file : url);

  const onSubmit = async () => {
    setSaving(true);
    setError(null);

    try {
      if (mode === 'file') await uploads.subtitle(episode.id, file, { language, label, default: isDefault });
      else await api.post(`${API_ROUTES.ADMIN}/anime/episodes/${episode.id}/subtitles`, { language, label, url, default: isDefault });

      reset();
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message ?? err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      size="lg"
      title={`Nuevos subtítulos · Episodio ${episode?.number}`}
      actions={
        <>
          <Button color="ghost" size="sm" disabled={saving} onClick={close}>Cancelar</Button>
          <Button size="sm" disabled={!ready} loading={saving} onClick={onSubmit}>
            Guardar
          </Button>
        </>
      }
    >
      <div role="tablist" aria-label="Origen de los subtítulos" className="flex w-fit border border-line bg-surface">
        {MODES.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={mode === item.key}
            disabled={saving}
            onClick={() => { setMode(item.key); setError(null); }}
            className={clsx(
              'cursor-pointer px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors',
              mode === item.key ? 'bg-accent text-accent-fg' : 'text-muted hover:bg-surface-2 hover:text-fg',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {mode === 'file' ? (
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
              <span className="text-xs text-muted">{kilobytes(file.size)} · suelta otro para reemplazarlo</span>
            </>
          ) : (
            <>
              <span className="text-sm font-semibold">Suelta aquí el archivo de subtítulos</span>
              <span className="text-xs text-muted">o haz clic para elegirlo · {ACCEPT.join(' · ')}</span>
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
      ) : (
        <Input full name="url" label="URL del archivo .vtt" value={url} onChange={(event) => setUrl(event.target.value)} disabled={saving} />
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          full
          name="language"
          label="Código de idioma (es, en, es-419…)"
          value={language}
          onChange={(event) => changeLanguage(event.target.value.trim().toLowerCase())}
          disabled={saving}
        />

        <Input
          full
          name="label"
          label="Nombre que se muestra"
          value={label}
          onChange={(event) => { setLabelTouched(true); setLabel(event.target.value); }}
          disabled={saving}
        />
      </div>

      <Switch label="Activados por defecto" checked={isDefault} onChange={setIsDefault} />

      {error && <p className="text-xs text-red-400">{error}</p>}

      <p className="text-xs text-muted">
        {mode === 'file'
          ? 'Los .ass, .ssa y .srt se convierten a WebVTT al guardarlos; del .ass se conserva el texto y el tiempo, no el estilo (colores, posición, karaoke). Subir otro del mismo idioma reemplaza el anterior.'
          : 'El servidor que aloje el archivo debe enviar la cabecera CORS (Access-Control-Allow-Origin); si no, el navegador no lo cargará.'}
      </p>
    </Dialog>
  )
}

export default SubtitleDialog
