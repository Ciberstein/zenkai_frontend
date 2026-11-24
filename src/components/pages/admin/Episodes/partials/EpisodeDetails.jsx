import React from 'react'
import clsx from 'clsx'
import Icon from '../../../../shared/Icon'
import segmentsApi from '../../../../../services/segments.services'
import uploads from '../../../../../services/uploads.services'
import { audioLabel } from '../../../../../utils/player.util'
import { SEGMENT_TYPES, clock } from '../../../../../utils/segment.util'

// ─── Piezas ───────────────────────────────────────────────────────────────────

const MONO = 'font-mono text-[11px] uppercase tracking-[0.12em]';

// Botón de texto con borde, para las acciones de una fila o de la cabecera de una tarjeta.
const Action = ({ accent = false, className = '', ...props }) => (
  <button
    type="button"
    className={clsx(
      'h-8 shrink-0 cursor-pointer border px-3 transition-colors disabled:cursor-default disabled:opacity-50',
      MONO,
      accent
        ? 'border-accent/40 text-accent-text hover:bg-accent/10'
        : 'border-line text-muted hover:border-fg/40 hover:text-fg',
      className,
    )}
    {...props}
  />
)

const RemoveButton = ({ label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className="grid size-8 shrink-0 cursor-pointer place-items-center text-muted transition-colors hover:bg-red-500/15 hover:text-red-400"
  >
    <Icon name="x" className="size-4" />
  </button>
)

// Etiqueta pequeña dentro de la línea de datos de una fila ("Por defecto", "AniSkip"…).
const Tag = ({ tone = 'plain', children }) => (
  <span
    className={clsx(
      'px-1.5 py-0.5 text-[10px] leading-none',
      tone === 'accent' ? 'bg-accent/15 text-accent-text' : 'bg-surface-2 text-fg/70',
    )}
  >
    {children}
  </span>
)

// Una sección del panel: cabecera con título, recuento y acciones, y debajo sus filas.
const Card = ({ title, count, actions = null, notice = null, empty, list = 'divide-y divide-line', children }) => (
  <section className="flex flex-col border border-line bg-surface">
    <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-4 py-3">
      <h3 className="font-display text-sm font-bold uppercase tracking-[0.1em]">{title}</h3>
      <span className="tnum grid h-5 min-w-5 place-items-center bg-surface-2 px-1.5 font-mono text-[11px] text-fg/70">{count}</span>

      {actions && <div className="ml-auto flex flex-wrap gap-1.5">{actions}</div>}
    </header>

    {notice && <p className="border-b border-line bg-surface-2/50 px-4 py-2 text-xs text-muted">{notice}</p>}

    {count ? <ul className={list}>{children}</ul> : <p className="px-4 py-6 text-center text-sm text-muted">{empty}</p>}
  </section>
)

// Una fila: nombre y línea de datos a la izquierda, acciones a la derecha.
const Row = ({ title, meta, actions = null }) => (
  <li className="flex min-h-16 items-center gap-3 bg-surface px-4 py-3">
    <div className="min-w-0 flex-1">
      <div className="truncate text-sm font-semibold">{title}</div>
      <p className={clsx('mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted', MONO)}>{meta}</p>
    </div>

    {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
  </li>
)

// ─── Audios ───────────────────────────────────────────────────────────────────

const AudioCard = ({ episodeId, tracks, error, setError, load }) => {

  const makeDefault = async (track) => {
    try {
      await uploads.defaultAudio(episodeId, track.dir);
      load();
    } catch (err) {
      setError(err.response?.data?.message ?? err.message);
    }
  };

  // Edición del nombre en la propia fila: { dir, value }
  const [editing, setEditing] = React.useState(null);
  const [saving, setSaving] = React.useState(false);

  const rename = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      await uploads.renameAudio(episodeId, editing.dir, editing.value.trim());
      setEditing(null);
      setError(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message ?? err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (track) => {
    const name = audioLabel(track, track.lang ?? track.dir);
    if (!window.confirm(`¿Quitar el audio "${name}" (${track.dir}) del episodio? Se borra también del bucket.`)) return;

    try {
      await uploads.removeAudio(episodeId, track.dir);
      load();
    } catch (err) {
      setError(err.response?.data?.message ?? err.message);
    }
  };

  return (
    <Card title="Audios" count={tracks?.length ?? 0} notice={error} empty={error ? 'No se pudieron leer los audios.' : tracks ? 'Ninguno.' : 'Cargando…'}>
      {(tracks ?? []).map((track) => (
        <Row
          key={track.dir}
          title={editing?.dir === track.dir ? (
            <form onSubmit={rename} className="flex items-center gap-2">
              <input
                autoFocus
                value={editing.value}
                maxLength={40}
                placeholder={audioLabel({ lang: track.lang }, track.dir)}
                onChange={(event) => setEditing({ dir: track.dir, value: event.target.value })}
                onKeyDown={(event) => event.key === 'Escape' && setEditing(null)}
                aria-label="Nombre del audio"
                className="h-8 min-w-0 flex-1 border border-line bg-surface-2 px-2 text-sm font-semibold outline-none focus:border-accent"
              />
              <Action type="submit" accent disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Action>
              <Action onClick={() => setEditing(null)}>Cancelar</Action>
            </form>
          ) : audioLabel(track, track.lang ?? track.dir)}
          meta={<><span>{track.dir}</span>{track.default && <Tag tone="accent">Por defecto</Tag>}</>}
          actions={editing?.dir === track.dir ? null : (
            <>
              <Action onClick={() => setEditing({ dir: track.dir, value: track.name ?? '' })}>Renombrar</Action>
              {!track.default && <Action onClick={() => makeDefault(track)}>Predeterminar</Action>}
              {tracks.length > 1 && <RemoveButton label={`Quitar el audio ${track.dir}`} onClick={() => remove(track)} />}
            </>
          )}
        />
      ))}
    </Card>
  )
}

// ─── Marcas ───────────────────────────────────────────────────────────────────

// Marcas del episodio (intro, créditos, resumen) con su origen. Se pueden buscar en AniSkip,
// poner a mano o quitar.
const SegmentCard = ({ episode, onSegment, onChanged }) => {

  const [message, setMessage] = React.useState(null);
  const [searching, setSearching] = React.useState(false);

  const segments = episode.segments ?? [];

  const search = async () => {
    setSearching(true);
    setMessage(null);

    try {
      const result = await segmentsApi.search(episode.id);

      setMessage(result.found ? `AniSkip: ${result.saved} nueva(s)${result.kept ? `, ${result.kept} manual(es) intacta(s)` : ''}` : 'Sin datos en AniSkip para este episodio');
      onChanged();
    } catch (err) {
      setMessage(err.response?.data?.message ?? err.message);
    } finally {
      setSearching(false);
    }
  };

  const remove = async (segment) => {
    await segmentsApi.remove(episode.id, segment.type);
    onChanged();
  };

  return (
    <Card
      title="Marcas"
      count={segments.length}
      notice={message}
      empty="Ninguna. Búscalas en AniSkip o añádelas a mano."
      actions={
        <>
          <Action accent disabled={searching} onClick={search}>{searching ? 'Buscando…' : 'Buscar en AniSkip'}</Action>
          <Action accent onClick={() => onSegment(episode, null)}>+ Añadir</Action>
        </>
      }
    >
      {segments.map((segment) => (
        <Row
          key={segment.id}
          title={SEGMENT_TYPES.find((item) => item.value === segment.type)?.label ?? segment.type}
          meta={
            <>
              <span className="tnum">{clock(segment.start)} – {clock(segment.end)}</span>
              <Tag>{segment.source === 'manual' ? 'Manual' : segment.source === 'aniskip' ? 'AniSkip' : segment.source}</Tag>
            </>
          }
          actions={
            <>
              <Action onClick={() => onSegment(episode, segment)}>Editar</Action>
              <RemoveButton label={`Quitar la marca ${segment.type}`} onClick={() => remove(segment)} />
            </>
          }
        />
      ))}
    </Card>
  )
}

// ─── Subtítulos ───────────────────────────────────────────────────────────────

const LANG = /^[a-z]{2,3}(-[a-z0-9]{2,8})?$/i;

const FIELD = 'h-8 min-w-0 border border-line bg-surface-2 px-2 text-sm outline-none focus:border-accent';

const SubtitleCard = ({ subtitles, onChanged, onRemove }) => {

  // Edición en la propia fila: { id, label, language }
  const [editing, setEditing] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);

  const run = async (action) => {
    setSaving(true);

    try {
      await action();
      setEditing(null);
      setError(null);
      onChanged();
    } catch (err) {
      setError(err.response?.data?.message ?? err.message);
    } finally {
      setSaving(false);
    }
  };

  const save = (event) => {
    event.preventDefault();
    run(() => uploads.updateSubtitle(editing.id, { label: editing.label.trim(), language: editing.language.trim().toLowerCase() }));
  };

  return (
    <Card
      title="Subtítulos"
      count={subtitles.length}
      list="grid max-h-[32rem] gap-px overflow-y-auto bg-line lg:grid-cols-2"
      notice={error} empty="Ninguno. Se añaden al subir el video o con «Añadir subtítulos».">
      {subtitles.map((subtitle) => (
        <Row
          key={subtitle.id}
          title={editing?.id === subtitle.id ? (
            <form onSubmit={save} className="flex flex-wrap items-center gap-2">
              <input
                autoFocus
                value={editing.label}
                maxLength={60}
                onChange={(event) => setEditing({ ...editing, label: event.target.value })}
                onKeyDown={(event) => event.key === 'Escape' && setEditing(null)}
                aria-label="Nombre de los subtítulos"
                className={clsx(FIELD, 'flex-1 basis-32 font-semibold')}
              />
              <input
                value={editing.language}
                maxLength={12}
                onChange={(event) => setEditing({ ...editing, language: event.target.value })}
                onKeyDown={(event) => event.key === 'Escape' && setEditing(null)}
                aria-label="Idioma (es, en, es-419…)"
                placeholder="es"
                className={clsx(FIELD, 'w-20 font-mono')}
              />
              <Action type="submit" accent disabled={saving || !editing.label.trim() || !LANG.test(editing.language.trim())}>{saving ? 'Guardando…' : 'Guardar'}</Action>
              <Action onClick={() => setEditing(null)}>Cancelar</Action>
            </form>
          ) : subtitle.label}
          meta={<><span>{subtitle.language}</span>{subtitle.default && <Tag tone="accent">Por defecto</Tag>}</>}
          actions={editing?.id === subtitle.id ? null : (
            <>
              <Action onClick={() => setEditing({ id: subtitle.id, label: subtitle.label, language: subtitle.language })}>Editar</Action>
              {!subtitle.default && <Action disabled={saving} onClick={() => run(() => uploads.updateSubtitle(subtitle.id, { default: true }))}>Predeterminar</Action>}
              <RemoveButton label={`Quitar los subtítulos ${subtitle.label}`} onClick={() => onRemove(subtitle.id)} />
            </>
          )}
        />
      ))}
    </Card>
  )
}

// ─── EpisodeDetails ───────────────────────────────────────────────────────────

// El panel que se despliega bajo un episodio: fuentes, audios, marcas y subtítulos, cada uno en
// su tarjeta. Fuentes y marcas van en una columna y audios en otra; los subtítulos, que pueden ser decenas, ocupan todo el ancho en dos columnas con scroll.
const EpisodeDetails = ({ episode, published, audio, onSegment, onChanged, onRemoveSource, onRemoveSubtitle }) => {

  const sources = episode.sources ?? [];
  const subtitles = episode.subtitles ?? [];

  return (
    <div className="flex flex-col gap-4 border-t border-line bg-bg/40 p-4 sm:p-5">
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
      <Card title="Fuentes" count={sources.length} empty="Ninguna todavía. Sube un video o añade una URL.">
        {sources.map((source) => (
          <Row
            key={source.id}
            title={source.server}
            meta={
              <>
                <Tag>{source.type}</Tag>
                <span>{source.quality}</span>
                <span>{source.language === 'dub' ? 'Doblado' : 'Subtitulado'}</span>
              </>
            }
            actions={<RemoveButton label={`Quitar la fuente ${source.server}`} onClick={() => onRemoveSource(source.id)} />}
          />
        ))}
      </Card>

      {sources.length > 0 && <SegmentCard episode={episode} onSegment={onSegment} onChanged={onChanged} />}
        </div>

        {published && <AudioCard episodeId={episode.id} {...audio} />}
      </div>

      <SubtitleCard subtitles={subtitles} onChanged={onChanged} onRemove={onRemoveSubtitle} />
    </div>
  )
}

export default EpisodeDetails
