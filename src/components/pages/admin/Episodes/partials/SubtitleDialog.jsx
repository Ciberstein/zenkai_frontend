import React from 'react'
import { API_ROUTES } from '../../../../../api/routes'
import api from '../../../../../api/axios'
import { Button, Dialog, Input, Switch } from '../../../../material'

// ─── SubtitleDialog ───────────────────────────────────────────────────────────

const EMPTY = { language: 'es', label: 'Español', url: '', default: false };

// Una pista de subtitulos es un archivo WebVTT (.vtt) alojado en algun sitio.
// Va aparte de las fuentes: sirve con cualquier calidad o servidor del episodio.
const SubtitleDialog = ({ episode, open, onClose, onSaved }) => {

  const [form, setForm] = React.useState(EMPTY);
  const [saving, setSaving] = React.useState(false);

  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
  const setInput = (key) => (event) => set(key)(event.target.value);

  const onSubmit = async () => {
    setSaving(true);
    await api.post(`${API_ROUTES.ADMIN}/anime/episodes/${episode.id}/subtitles`, form);
    setSaving(false);
    setForm(EMPTY);
    onSaved();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={`Nuevos subtítulos · Episodio ${episode?.number}`}
      actions={
        <>
          <Button color="ghost" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" disabled={!form.language || !form.label || !form.url} loading={saving} onClick={onSubmit}>
            Guardar
          </Button>
        </>
      }
    >
      <Input full name="url" label="URL del archivo .vtt" value={form.url} onChange={setInput('url')} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input full name="language" label="Código de idioma (es, en, es-419…)" value={form.language} onChange={setInput('language')} />
        <Input full name="label" label="Nombre que se muestra" value={form.label} onChange={setInput('label')} />
      </div>

      <Switch label="Activados por defecto" checked={form.default} onChange={set('default')} />

      <p className="text-xs text-muted">
        El servidor que aloje el archivo debe enviar la cabecera CORS
        (<span className="font-mono">Access-Control-Allow-Origin</span>); si no, el navegador no lo cargará.
      </p>
    </Dialog>
  )
}

export default SubtitleDialog
