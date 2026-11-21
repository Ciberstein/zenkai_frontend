import React from 'react'
import clsx from 'clsx'
import Icon from '../../../../shared/Icon'
import segmentsApi from '../../../../../services/segments.services'
import uploads from '../../../../../services/uploads.services'
import { languageName } from '../../../../../utils/player.util'
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
const Card = ({ title, count, actions = null, notice = null, empty, children }) => (
  <section className="flex flex-col border border-line bg-surface">
    <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-4 py-3">
      <h3 className="font-display text-sm font-bold uppercase tracking-[0.1em]">{title}</h3>
      <span className="tnum grid h-5 min-w-5 place-items-center bg-surface-2 px-1.5 font-mono text-[11px] text-fg/70">{count}</span>

      {actions && <div className="ml-auto flex flex-wrap gap-1.5">{actions}</div>}
    </header>

    {notice && <p className="border-b border-line bg-surface-2/50 px-4 py-2 text-xs text-muted">{notice}</p>}

    {count ? <ul className="divide-y divide-line">{children}</ul> : <p className="px-4 py-6 text-center text-sm text-muted">{empty}</p>}
  </section>
)

// Una fila: nombre y línea de datos a la izquierda, acciones a la derecha.
const Row = ({ title, meta, actions = null }) => (
  <li className="flex min-h-16 items-center gap-3 px-4 py-3">
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold">{title}</p>
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

  const remove = async (track) => {
    const name = languageName(track.lang, track.lang ?? track.dir);
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
          title={languageName(track.lang, track.lang ?? track.dir)}
          meta={<><span>{track.dir}</span>{track.default && <Tag tone="accent">Por defecto</Tag>}</>}
          actions={
            <>
              {!track.default && <Action onClick={() => makeDefault(track)}>Predeterminar</Action>}
              {tracks.length > 1 && <RemoveButton label={`Quitar el audio ${track.dir}`} onClick={() => remove(track)} />}
            </>
          }
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

// ─── EpisodeDetails ───────────────────────────────────────────────────────────

// El panel que se despliega bajo un episodio: fuentes, audios, marcas y subtítulos, cada uno en
// su tarjeta. En pantallas anchas van de dos en dos; en móvil, una debajo de otra.
const EpisodeDetails = ({ episode, published, audio, onSegment, onChanged, onRemoveSource, onRemoveSubtitle }) => {

  const sources = episode.sources ?? [];
  const subtitles = episode.subtitles ?? [];

  return (
    <div className="grid items-start gap-4 border-t border-line bg-bg/40 p-4 sm:p-5 lg:grid-cols-2">
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

      {published && <AudioCard episodeId={episode.id} {...audio} />}

      {sources.length > 0 && <SegmentCard episode={episode} onSegment={onSegment} onChanged={onChanged} />}

      <Card title="Subtítulos" count={subtitles.length} empty="Ninguno. Se añaden al subir el video o con «Añadir subtítulos».">
        {subtitles.map((subtitle) => (
          <Row
            key={subtitle.id}
            title={subtitle.label}
            meta={<><span>{subtitle.language}</span>{subtitle.default && <Tag tone="accent">Por defecto</Tag>}</>}
            actions={<RemoveButton label={`Quitar los subtítulos ${subtitle.label}`} onClick={() => onRemoveSubtitle(subtitle.id)} />}
          />
        ))}
      </Card>
    </div>
  )
}

export default EpisodeDetails
