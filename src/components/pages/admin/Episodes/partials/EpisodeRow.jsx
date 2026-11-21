import React from 'react'
import clsx from 'clsx'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Button } from '../../../../material'
import Icon from '../../../../shared/Icon'
import segmentsApi from '../../../../../services/segments.services'
import uploads from '../../../../../services/uploads.services'
import { languageName } from '../../../../../utils/player.util'
import { UPLOAD_BUSY, latestUpload } from '../../../../../utils/upload.util'
import { SEGMENT_TYPES, clock } from '../../../../../utils/segment.util'

// ─── Constantes ───────────────────────────────────────────────────────────────

const UPLOAD_LABEL = { uploading: 'Subiendo', queued: 'En cola', processing: 'Convirtiendo', error: 'Error' };

const MENU_ITEM = clsx(
  'flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left text-sm text-fg/90',
  'transition-colors data-focus:bg-surface-2 data-focus:text-fg',
);

const MONO = 'font-mono text-[11px] uppercase tracking-[0.12em]';

const formatDate = (iso) => {
  const date = iso ? new Date(iso) : null;
  if (!date || Number.isNaN(date.getTime())) return null;

  // La fecha viene a medianoche UTC: sin fijar la zona, en America saldria un dia antes.
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
};

// "29 sep 2023 · 24 min · Relleno"
const metaOf = (episode) => [
  formatDate(episode.aired),
  episode.duration >= 60 ? `${Math.round(episode.duration / 60)} min` : null,
  episode.filler ? 'Relleno' : null,
  episode.recap ? 'Recap' : null,
  episode.visible === false ? 'Oculto' : null,
].filter(Boolean).join(' · ');

// ─── Piezas ───────────────────────────────────────────────────────────────────

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

// Una lista del panel desplegado: cabecera con el recuento y filas separadas por una linea.
const Block = ({ title, count, empty, children }) => (
  <section>
    <h3 className="mb-1 flex items-baseline gap-2 font-mono text-[11px] font-normal uppercase tracking-[0.18em] text-muted">
      {title}
      <span className="tnum text-fg/60">{count}</span>
    </h3>

    {count ? <ul className="divide-y divide-line">{children}</ul> : <p className="py-2 text-sm text-muted">{empty}</p>}
  </section>
)

// Audios del episodio, leidos del manifiesto publicado. Se vuelven a leer cuando cambia la
// ultima subida (por ejemplo, al terminar de añadir un doblaje).
const useAudio = (episodeId, enabled, version) => {

  const [tracks, setTracks] = React.useState(null);
  const [error, setError] = React.useState(null);

  const load = React.useCallback(() => {
    if (!enabled) return;

    uploads.audio(episodeId)
      .then((list) => { setTracks(list); setError(null); })
      .catch((err) => setError(err.response?.data?.message ?? err.message));
  }, [episodeId, enabled]);

  React.useEffect(() => { load() }, [load, version]);

  return { tracks, error, setError, load };
}

const AudioBlock = ({ episodeId, tracks, error, setError, load }) => {

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
    <section>
      <h3 className="mb-1 flex items-baseline gap-2 font-mono text-[11px] font-normal uppercase tracking-[0.18em] text-muted">
        Audios
        <span className="tnum text-fg/60">{tracks?.length ?? 0}</span>
      </h3>

      {error && <p className="py-2 text-sm text-red-400">{error}</p>}

      {tracks && (
        <ul className="divide-y divide-line">
          {tracks.map((track) => (
            <li key={track.dir} className="flex items-center gap-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{languageName(track.lang, track.lang ?? track.dir)}</p>
                <p className={clsx('truncate text-muted', MONO)}>
                  {track.dir}
                  {track.default && <span className="text-accent-text"> · por defecto</span>}
                </p>
              </div>

              {!track.default && (
                <button
                  type="button"
                  onClick={() => makeDefault(track)}
                  className={clsx('shrink-0 cursor-pointer px-2 py-1 text-muted transition-colors hover:bg-surface-2 hover:text-fg', MONO)}
                >
                  Predeterminado
                </button>
              )}

              {tracks.length > 1 && <RemoveButton label={`Quitar el audio ${track.dir}`} onClick={() => remove(track)} />}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// Marcas del episodio (intro, créditos, resumen) con su origen. Se pueden buscar en AniSkip,
// poner a mano o quitar.
const SegmentBlock = ({ episode, onSegment, onChanged }) => {

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
    <section>
      <h3 className="mb-1 flex items-baseline gap-2 font-mono text-[11px] font-normal uppercase tracking-[0.18em] text-muted">
        Marcas
        <span className="tnum text-fg/60">{segments.length}</span>

        <span className="ml-auto flex gap-1">
          <button type="button" disabled={searching} onClick={search} className="cursor-pointer px-2 py-0.5 normal-case tracking-normal text-accent-text hover:bg-surface-2 disabled:opacity-50">
            {searching ? 'Buscando…' : 'Buscar en AniSkip'}
          </button>
          <button type="button" onClick={() => onSegment(episode, null)} className="cursor-pointer px-2 py-0.5 normal-case tracking-normal text-accent-text hover:bg-surface-2">
            + Añadir
          </button>
        </span>
      </h3>

      {message && <p className="py-1 text-xs text-muted">{message}</p>}

      {segments.length ? (
        <ul className="divide-y divide-line">
          {segments.map((segment) => (
            <li key={segment.id} className="flex items-center gap-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{SEGMENT_TYPES.find((item) => item.value === segment.type)?.label ?? segment.type}</p>
                <p className={clsx('truncate text-muted', MONO)}>
                  {clock(segment.start)} – {clock(segment.end)} · {segment.source === 'manual' ? 'manual' : segment.source === 'aniskip' ? 'AniSkip' : segment.source}
                </p>
              </div>

              <button type="button" onClick={() => onSegment(episode, segment)} className={clsx('shrink-0 cursor-pointer px-2 py-1 text-muted transition-colors hover:bg-surface-2 hover:text-fg', MONO)}>
                Editar
              </button>
              <RemoveButton label={`Quitar la marca ${segment.type}`} onClick={() => remove(segment)} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-2 text-sm text-muted">Ninguna. Búscalas en AniSkip o añádelas a mano.</p>
      )}
    </section>
  )
}

// ─── EpisodeRow ───────────────────────────────────────────────────────────────

// Una fila limpia por episodio: numero, titulo con sus datos, estado y acciones. Lo que
// antes eran decenas de etiquetas (fuentes, subtitulos, subida) vive ahora en un panel
// que se despliega, asi la lista se lee de un vistazo aunque haya cientos de episodios.
const EpisodeRow = ({
  episode, open, onToggle,
  onUpload, onSource, onSubtitle, onAudio, onSegment, onChanged,
  onRemoveSource, onRemoveSubtitle,
  onRetry, onDiscard,
}) => {

  const [over, setOver] = React.useState(false);

  const upload = latestUpload(episode);
  const busy = UPLOAD_BUSY.includes(upload?.status);
  const failed = upload?.status === 'error';

  const sources = episode.sources ?? [];
  const subtitles = episode.subtitles ?? [];
  const available = sources.length > 0;
  const published = sources.some((source) => source.type === 'hls');

  const audio = useAudio(episode.id, published, upload?.id ? `${upload.id}-${upload.status}` : '');

  const meta = metaOf(episode);
  const summary = [
    `${sources.length} ${sources.length === 1 ? 'fuente' : 'fuentes'}`,
    subtitles.length ? `${subtitles.length} ${subtitles.length === 1 ? 'subtítulo' : 'subtítulos'}` : null,
    audio.tracks?.length ? `${audio.tracks.length} ${audio.tracks.length === 1 ? 'audio' : 'audios'}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <li
      onDragOver={(event) => { if (!busy) { event.preventDefault(); setOver(true); } }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        if (!busy && event.dataTransfer.files.length) onUpload(episode, event.dataTransfer.files);
      }}
      className={clsx('border bg-surface transition-colors', over ? 'border-accent bg-accent/10' : 'border-line')}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 sm:flex-nowrap sm:gap-4 sm:px-4">
        <span className="grid size-10 shrink-0 place-items-center bg-surface-2 font-display text-base font-bold tnum">
          {episode.number}
        </span>

        <div className="min-w-40 flex-1">
          <p className="truncate text-sm font-semibold">{episode.title ?? `Episodio ${episode.number}`}</p>

          {/* Datos del episodio; durante una subida, en su lugar, lo que esta pasando */}
          {busy || failed ? (
            <p className={clsx('line-clamp-2 text-xs', failed ? 'text-red-400' : 'text-accent-text')} title={upload.message ?? ''}>
              {upload.message ?? UPLOAD_LABEL[upload.status]}
            </p>
          ) : (
            meta && <p className={clsx('truncate text-muted', MONO)}>{meta}</p>
          )}
        </div>

        {/* Estado: subida en curso, error o disponibilidad */}
        {busy || failed ? (
          <span
            className={clsx(
              'hidden shrink-0 items-center gap-2 border px-2.5 py-1 sm:inline-flex',
              MONO,
              failed ? 'border-red-500/40 bg-red-500/10 text-red-400' : 'border-accent/40 bg-accent/10 text-accent-text',
            )}
          >
            {busy && <span aria-hidden="true" className="size-3 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />}
            {UPLOAD_LABEL[upload.status]}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onToggle(episode.id)}
            aria-expanded={open}
            className={clsx(
              'hidden shrink-0 cursor-pointer items-center gap-2 px-2 py-1 transition-colors hover:text-fg sm:inline-flex',
              MONO,
              available ? 'text-fg/80' : 'text-muted',
            )}
          >
            <span aria-hidden="true" className={clsx('size-2 shrink-0', available ? 'bg-accent' : 'bg-line')} />
            {available ? summary : 'Sin video'}
            <Icon name="chevron-right" className={clsx('size-3.5 transition-transform', open && 'rotate-90')} />
          </button>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1">
          {failed ? (
            <>
              <Button color="ghost" size="sm" onClick={() => onRetry(upload.id)}>Reintentar</Button>
              <Button color="ghost" size="sm" onClick={() => onDiscard(upload.id)}>Descartar</Button>
            </>
          ) : (
            <Button size="sm" disabled={busy} onClick={() => onUpload(episode)}>
              ↑<span className="hidden sm:inline"> Subir video</span>
            </Button>
          )}

          <Menu>
            <MenuButton
              aria-label="Más acciones"
              className="grid size-9 cursor-pointer place-items-center text-muted transition-colors hover:bg-surface-2 hover:text-fg data-open:bg-surface-2 data-open:text-fg"
            >
              <Icon name="more" className="size-5" />
            </MenuButton>

            <MenuItems
              anchor="bottom end"
              transition
              className={clsx(
                'z-50 w-64 border border-line bg-surface p-1 text-fg [--anchor-gap:4px]',
                'shadow-[0_20px_40px_-12px_rgb(0_0_0/0.7)]',
                'origin-top-right transition duration-150 ease-out',
                'data-closed:scale-95 data-closed:opacity-0',
              )}
            >
              <MenuItem>
                <button type="button" className={MENU_ITEM} onClick={() => onSource(episode)}>
                  <Icon name="plus" className="size-4.5 text-muted" />
                  Añadir fuente (URL)
                </button>
              </MenuItem>

              <MenuItem>
                <button type="button" className={MENU_ITEM} onClick={() => onSubtitle(episode)}>
                  <Icon name="captions" className="size-4.5 text-muted" />
                  Añadir subtítulos
                </button>
              </MenuItem>

              {published && (
                <MenuItem>
                  <button type="button" className={MENU_ITEM} onClick={() => onAudio(episode)}>
                    <Icon name="volume" className="size-4.5 text-muted" />
                    Añadir audio (doblaje)
                  </button>
                </MenuItem>
              )}
            </MenuItems>
          </Menu>
        </div>

        {!busy && !failed && (
          <button
            type="button"
            onClick={() => onToggle(episode.id)}
            aria-expanded={open}
            className={clsx('flex basis-full cursor-pointer items-center gap-2 pl-13 text-left sm:hidden', MONO, available ? 'text-fg/80' : 'text-muted')}
          >
            <span aria-hidden="true" className={clsx('size-2 shrink-0', available ? 'bg-accent' : 'bg-line')} />
            {available ? summary : 'Sin video'}
            <Icon name="chevron-right" className={clsx('size-3.5 transition-transform', open && 'rotate-90')} />
          </button>
        )}
      </div>

      {open && (
        <div className="grid gap-6 border-t border-line bg-surface-2/40 px-4 py-4 sm:grid-cols-2 xl:grid-cols-4 sm:px-5">
          <Block title="Fuentes" count={sources.length} empty="Ninguna todavía. Sube un video o añade una URL.">
            {sources.map((source) => (
              <li key={source.id} className="flex items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{source.server}</p>
                  <p className={clsx('truncate text-muted', MONO)}>
                    {source.type} · {source.quality} · {source.language === 'dub' ? 'Doblado' : 'Subtitulado'}
                  </p>
                </div>

                <RemoveButton label={`Quitar la fuente ${source.server}`} onClick={() => onRemoveSource(source.id)} />
              </li>
            ))}
          </Block>

          {published && <AudioBlock episodeId={episode.id} {...audio} />}

          {available && <SegmentBlock episode={episode} onSegment={onSegment} onChanged={onChanged} />}

          <Block title="Subtítulos" count={subtitles.length} empty="Ninguno. Se añaden al subir el video o con «Añadir subtítulos».">
            {subtitles.map((subtitle) => (
              <li key={subtitle.id} className="flex items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{subtitle.label}</p>
                  <p className={clsx('truncate text-muted', MONO)}>
                    {subtitle.language}
                    {subtitle.default && <span className="text-accent-text"> · por defecto</span>}
                  </p>
                </div>

                <RemoveButton label={`Quitar los subtítulos ${subtitle.label}`} onClick={() => onRemoveSubtitle(subtitle.id)} />
              </li>
            ))}
          </Block>
        </div>
      )}
    </li>
  )
}

export default React.memo(EpisodeRow)
