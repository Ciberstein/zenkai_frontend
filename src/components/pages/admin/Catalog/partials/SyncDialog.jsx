import React from 'react'
import { useDispatch } from 'react-redux'
import { syncAnimeThunk } from '../../../../../store/slices/admin.anime.slice'
import { Button, Dialog, Input } from '../../../../material'

// ─── SyncDialog ───────────────────────────────────────────────────────────────

// Se pide el MAL id a mano: es el identificador con el que responde la API
// oficial y evita replicar aqui el buscador completo.
const SyncDialog = ({ open, onClose }) => {

  const [malId, setMalId] = React.useState('');
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const dispatch = useDispatch();

  const onSync = async () => {
    setLoading(true);
    setError(null);

    const res = await dispatch(syncAnimeThunk(malId));

    setLoading(false);

    if (!res) return setError('No se pudo importar ese título');

    setMalId('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      title="Importar desde MyAnimeList"
      actions={
        <>
          <Button color="ghost" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" disabled={!malId} loading={loading} onClick={onSync}>Importar</Button>
        </>
      }
    >
      {error && (
        <p role="alert" className="border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">
          {error}
        </p>
      )}

      <Input
        full
        autoFocus
        name="malId"
        label="MAL ID"
        value={malId}
        onChange={(event) => setMalId(event.target.value)}
      />

      <p className="text-xs text-muted">Ej: 5114 para Fullmetal Alchemist: Brotherhood</p>
    </Dialog>
  )
}

export default SyncDialog
