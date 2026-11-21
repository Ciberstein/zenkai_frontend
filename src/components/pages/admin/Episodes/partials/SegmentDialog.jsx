import React from 'react'
import segmentsApi from '../../../../../services/segments.services'
import { Button, Dialog, Input, Select } from '../../../../material'
import { SEGMENT_TYPES, clock, parseClock } from '../../../../../utils/segment.util'

// ─── SegmentDialog ────────────────────────────────────────────────────────────

// Pone a mano una marca de un episodio: dónde empieza y dónde acaba la intro, los créditos o el
// resumen. Lo manual manda sobre AniSkip y sobre cualquier detección automática.
const SegmentDialog = ({ episode, segment = null, open, onClose, onSaved }) => {

  const [type, setType] = React.useState(segment?.type ?? 'intro');
  const [start, setStart] = React.useState(segment ? clock(segment.start) : '');
  const [end, setEnd] = React.useState(segment ? clock(segment.end) : '');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);

  const from = parseClock(start);
  const to = parseClock(end);
  const valid = from !== null && to !== null && to > from;

  const onSubmit = async () => {
    setSaving(true);
    setError(null);

    try {
      await segmentsApi.set(episode.id, type, { start: from, end: to });
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
      onClose={() => !saving && onClose()}
      size="md"
      title={`${segment ? 'Editar' : 'Nueva'} marca · Episodio ${episode?.number}`}
      actions={
        <>
          <Button color="ghost" size="sm" disabled={saving} onClick={onClose}>Cancelar</Button>
          <Button size="sm" disabled={!valid} loading={saving} onClick={onSubmit}>Guardar</Button>
        </>
      }
    >
      <Select full label="Tipo" value={type} onChange={setType} data={segment ? SEGMENT_TYPES.filter((item) => item.value === segment.type) : SEGMENT_TYPES} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input full name="start" label="Empieza (m:ss)" value={start} onChange={(event) => setStart(event.target.value)} disabled={saving} />
        <Input full name="end" label="Termina (m:ss)" value={end} onChange={(event) => setEnd(event.target.value)} disabled={saving} />
      </div>

      {(start || end) && !valid && <p className="text-xs text-red-400">Usa minutos y segundos (1:23 o 83), y que termine después de empezar.</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}

      <p className="text-xs text-muted">
        Son los tiempos del video publicado. En el reproductor aparecerá el botón «Saltar» mientras dure el tramo.
      </p>
    </Dialog>
  )
}

export default SegmentDialog
