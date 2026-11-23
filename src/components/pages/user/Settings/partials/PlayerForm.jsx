import React from 'react'
import clsx from 'clsx'
import { Button, Select } from '../../../../material'
import { CAPTION_DEFAULTS, CAPTION_FONTS, captionCss, readCaptionStyle, savePref } from '../../../../../utils/player.util'

// Un deslizador con su valor a la derecha.
const Slider = ({ id, label, value, min, max, step = 5, onChange }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-baseline justify-between">
      <label htmlFor={id} className="text-sm font-semibold">{label}</label>
      <span className="tnum font-mono text-xs text-muted">{value}%</span>
    </div>

    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="w-full cursor-pointer accent-accent"
    />
  </div>
)

const COLORS = [
  { value: '#ffffff', label: 'Blanco' },
  { value: '#ffe14d', label: 'Amarillo' },
  { value: '#5eead4', label: 'Turquesa' },
  { value: '#86efac', label: 'Verde' },
  { value: '#f9a8d4', label: 'Rosa' },
];

// Aspecto de los subtitulos del reproductor. Se guarda en este navegador, con el resto de
// preferencias del reproductor, y se aplica al abrir un episodio.
const PlayerForm = () => {

  const [style, setStyle] = React.useState(readCaptionStyle);

  const update = (key, pref) => (value) => {
    setStyle((current) => ({ ...current, [key]: value }));
    savePref(pref, value);
  };

  const reset = () => {
    setStyle(CAPTION_DEFAULTS);
    savePref('captionSize', CAPTION_DEFAULTS.size);
    savePref('captionOpacity', CAPTION_DEFAULTS.opacity);
    savePref('captionColor', CAPTION_DEFAULTS.color);
    savePref('captionFont', CAPTION_DEFAULTS.font);
  };

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h2 className="font-display text-sm font-bold uppercase tracking-[0.1em]">Subtítulos</h2>

      {/* Vista previa sobre una escena clara (nubes) para que se note el fondo del subtitulo */}
      <div
        aria-hidden="true"
        style={{ backgroundImage: 'url(/images/subtitles-bg.webp)', containerType: 'inline-size' }}
        className="cut grid aspect-video place-items-end justify-items-center overflow-hidden bg-cover bg-center px-[7%] pb-[6%] text-center"
      >
        <p
          style={captionCss(style, true)}
          className="max-w-full px-[1.5cqw] py-[0.3cqw] font-semibold leading-snug [text-shadow:0_1px_2px_rgb(0_0_0/0.9)]"
        >
          Así se verán los subtítulos
        </p>
      </div>

      <Slider id="caption-size" label="Tamaño" value={style.size} min={50} max={200} onChange={update('size', 'captionSize')} />
      <Slider id="caption-opacity" label="Opacidad del fondo" value={style.opacity} min={0} max={100} onChange={update('opacity', 'captionOpacity')} />

      <Select
        full
        label="Fuente"
        value={style.font}
        onChange={update('font', 'captionFont')}
        data={CAPTION_FONTS.map(({ value, label }) => ({ value, label }))}
      />

      <div className="flex flex-col gap-2">
        <span id="caption-color" className="text-sm font-semibold">Color del texto</span>

        <div role="radiogroup" aria-labelledby="caption-color" className="flex flex-wrap items-center gap-2">
          {COLORS.map((item) => (
            <button
              key={item.value}
              type="button"
              role="radio"
              aria-checked={style.color === item.value}
              aria-label={item.label}
              title={item.label}
              onClick={() => update('color', 'captionColor')(item.value)}
              style={{ backgroundColor: item.value }}
              className={clsx(
                'size-8 cursor-pointer rounded-full border-2 transition-transform hover:scale-110',
                style.color === item.value ? 'border-accent ring-2 ring-accent/40' : 'border-line',
              )}
            />
          ))}

          <label className="ml-1 flex cursor-pointer items-center gap-2 text-xs text-muted">
            <input
              type="color"
              value={style.color}
              onChange={(event) => update('color', 'captionColor')(event.target.value)}
              className="size-8 cursor-pointer border border-line bg-transparent p-0"
            />
            Otro
          </label>
        </div>
      </div>

      <div>
        <Button type="button" color="outline" onClick={reset}>Restablecer</Button>
      </div>
    </div>
  )
}

export default PlayerForm
