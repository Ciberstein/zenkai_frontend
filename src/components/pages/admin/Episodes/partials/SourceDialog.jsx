import React from 'react'
import { API_ROUTES } from '../../../../../api/routes'
import api from '../../../../../api/axios'
import { Button, Dialog, Input, Select } from '../../../../material'

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPES = [
  { value: 'hls', label: 'HLS (.m3u8)' },
  { value: 'mp4', label: 'MP4 directo' },
  { value: 'embed', label: 'Embed (iframe)' },
];

const LANGUAGES = [
  { value: 'sub', label: 'Subtitulado' },
  { value: 'dub', label: 'Doblado' },
];

const QUALITIES = ['auto', '360p', '480p', '720p', '1080p']
  .map((value) => ({ value, label: value }));

// ─── SourceDialog ─────────────────────────────────────────────────────────────

const EMPTY = { server: '', url: '', type: 'hls', quality: 'auto', language: 'sub' };

const SourceDialog = ({ episode, open, onClose, onSaved }) => {

  const [form, setForm] = React.useState(EMPTY);
  const [saving, setSaving] = React.useState(false);

  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
  const setInput = (key) => (event) => set(key)(event.target.value);

  const onSubmit = async () => {
    setSaving(true);
    await api.post(`${API_ROUTES.ADMIN}/anime/episodes/${episode.id}/sources`, form);
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
      title={`Nueva fuente · Episodio ${episode?.number}`}
      actions={
        <>
          <Button color="ghost" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" disabled={!form.server || !form.url} loading={saving} onClick={onSubmit}>
            Guardar
          </Button>
        </>
      }
    >
      <Input full name="server" label="Servidor" value={form.server} onChange={setInput('server')} />
      <Input full name="url" label="URL" value={form.url} onChange={setInput('url')} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Select full label="Tipo" value={form.type} onChange={set('type')} data={TYPES} />
        <Select full label="Calidad" value={form.quality} onChange={set('quality')} data={QUALITIES} />
        <Select full label="Idioma" value={form.language} onChange={set('language')} data={LANGUAGES} />
      </div>
    </Dialog>
  )
}

export default SourceDialog
