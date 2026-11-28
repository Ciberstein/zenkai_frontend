import React from 'react'
import { API_ROUTES } from '../../../../../api/routes'
import api from '../../../../../api/axios'
import { Button, Dialog, Input } from '../../../../material'

// ─── EpisodeCreateDialog ──────────────────────────────────────────────────────

// Crea la ficha de un episodio a mano, para cuando Jikan no lo lista.
const EpisodeCreateDialog = ({ animeId, nextNumber, open, onClose, onCreated }) => {

  const [form, setForm] = React.useState({ number: String(nextNumber), title: '', aired: '' });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);

  const setInput = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const onSubmit = async () => {
    setSaving(true);
    setError(null);

    try {
      await api.post(`${API_ROUTES.ADMIN}/anime/${animeId}/episodes`, {
        number: Number(form.number),
        title: form.title,
        aired: form.aired || null,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message ?? 'No se pudo crear el episodio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title="Nuevo episodio"
      actions={
        <>
          <Button color="ghost" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" disabled={!(Number(form.number) >= 1)} loading={saving} onClick={onSubmit}>Crear</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[8rem_1fr]">
        <Input full name="number" type="number" label="Número" value={form.number} onChange={setInput('number')} />
        <Input full name="title" label="Título" value={form.title} onChange={setInput('title')} />
      </div>
      <Input full name="aired" type="date" label="Fecha de emisión (opcional)" value={form.aired} onChange={setInput('aired')} />

      {error && <p role="alert" className="text-sm font-medium text-red-400">{error}</p>}
    </Dialog>
  )
}

export default EpisodeCreateDialog
