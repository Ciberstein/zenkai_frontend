import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { settingsThunk, updateSettingThunk } from '../../../../store/slices/settings.slice'
import { Button, Input, Switch } from '../../../material'

// ─── Field ────────────────────────────────────────────────────────────────────

// Los booleanos se guardan al instante; el resto pide confirmar, para no
// disparar un PATCH por cada tecla.
const Field = ({ item }) => {

  const [value, setValue] = React.useState(item.value ?? '');
  const dispatch = useDispatch();

  if (item.type === 'boolean') {
    return (
      <div className="flex items-center justify-between gap-4 border-b border-line/50 py-3.5 last:border-0">
        <span className="text-sm font-bold">{item.key}</span>
        <Switch
          checked={item.value === 'true'}
          onChange={(checked) => dispatch(updateSettingThunk(item.id, String(checked)))}
        />
      </div>
    )
  }

  return (
    <div className="flex items-end gap-3 border-b border-line/50 py-3.5 last:border-0">
      <Input
        full
        name={item.key}
        label={item.key}
        type={item.type === 'number' ? 'number' : 'text'}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />

      <Button
        size="sm"
        disabled={value === item.value}
        onClick={() => dispatch(updateSettingThunk(item.id, value))}
      >
        Guardar
      </Button>
    </div>
  )
};

// ─── SettingsPage ─────────────────────────────────────────────────────────────

export const SettingsPage = () => {

  const dispatch = useDispatch();
  const settings = useSelector(state => state.settings);

  React.useEffect(() => {
    dispatch(settingsThunk());
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl md:text-4xl">Configuración</h1>

      {settings.map((category) => (
        <section key={category.id} className="border border-line bg-surface p-5">
          <h2 className="mb-2 text-lg">{category.title}</h2>
          {category.items?.map((item) => <Field key={item.id} item={item} />)}
        </section>
      ))}
    </div>
  )
}
