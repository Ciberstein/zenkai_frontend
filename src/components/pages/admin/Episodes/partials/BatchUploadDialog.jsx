import React from 'react'
import clsx from 'clsx'
import uploads from '../../../../../services/uploads.services'
import { UPLOAD_BUSY, latestUpload } from '../../../../../utils/upload.util'
import { AUDIO, SUBS, VIDEO, guessEpisode, guessLang, kindOf, megabytes } from '../../../../../utils/batch.util'
import { subtitleName } from '../../../../../utils/player.util'
import { Button, Dialog, Input, Select } from '../../../../material'

const LANGUAGES = [
  { value: 'sub', label: 'Subtitulado' },
  { value: 'dub', label: 'Doblado' },
];

const LANG = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$/;
const KIND_LABEL = { video: 'Video', audio: 'Audio', sub: 'Subtítulos' };
const STATE_LABEL = { uploading: 'Subiendo', done: 'Listo', error: 'Error' };

let counter = 0;

// ─── BatchUploadDialog ────────────────────────────────────────────────────────

// Sube varios episodios de una vez. Se sueltan todos los archivos (videos, subtítulos y audios);
// cada uno se asigna al episodio que dice su nombre (01.mkv, Serie - 05 [1080p].mkv, 05.es.srt,
// 05.lat.m4a…) y se puede corregir antes de empezar. Un episodio con video se sube entero (con sus
// subtítulos y audios dentro); uno sin video añade sus subtítulos y audios al video que ya tiene
// publicado. Se sube un episodio detrás de otro, con el mismo flujo que las subidas individuales.
const BatchUploadDialog = ({ episodes, open, onClose, onDone }) => {

  const input = React.useRef(null);

  const [files, setFiles] = React.useState([]);        // { id, file, kind, number, lang }
  const [notice, setNotice] = React.useState(null);
  const [options, setOptions] = React.useState({ server: 'Zenkai', audioLang: 'ja', language: 'sub' });
  const [phase, setPhase] = React.useState('idle');    // idle | uploading
  const [status, setStatus] = React.useState({});      // número de episodio → { state, percent, message }
  const [sent, setSent] = React.useState(0);
  const [over, setOver] = React.useState(false);
  const [audioOnly, setAudioOnly] = React.useState(false);   // los videos se usan solo para sacar su audio
  const [extractLang, setExtractLang] = React.useState('lat');

  const uploading = phase === 'uploading';

  // Con «solo el audio», cada video pasa a ser un audio del idioma indicado: se sube el archivo y el
  // servicio de conversión saca de él la pista de ese idioma (por su etiqueta o título, p. ej. «Latino»).
  const view = React.useMemo(
    () => (audioOnly ? files.map((item) => (item.kind === 'video' ? { ...item, kind: 'audio', fromVideo: true, lang: item.lang || extractLang } : item)) : files),
    [files, audioOnly, extractLang],
  );

  const byNumber = React.useMemo(() => new Map(episodes.map((episode) => [episode.number, episode])), [episodes]);

  const addFiles = (list) => {
    const rejected = [];
    const added = [];

    for (const file of Array.from(list ?? [])) {
      const kind = kindOf(file.name);

      if (!kind) { rejected.push(file.name); continue; }

      counter += 1;
      added.push({ id: `${counter}`, file, kind, number: guessEpisode(file.name), lang: kind === 'video' ? '' : guessLang(file.name) });
    }

    setFiles((prev) => [...prev, ...added]);
    setNotice(rejected.length ? `Formato no admitido: ${rejected.join(', ')}` : null);
  };

  const patch = (id, changes) => setFiles((prev) => prev.map((item) => (item.id === id ? { ...item, ...changes } : item)));
  const remove = (id) => setFiles((prev) => prev.filter((item) => item.id !== id));

  // Una subida a medias se pierde si se cierra o recarga la pestaña.
  React.useEffect(() => {
    if (!uploading) return;

    const warn = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [uploading]);

  // Archivos agrupados por episodio, con lo que impide subir cada grupo (si algo lo impide).
  const groups = React.useMemo(() => {
    const map = new Map();

    for (const item of view) {
      const key = item.number ?? 'none';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }

    return [...map.entries()]
      .sort(([a], [b]) => (a === 'none' ? -1 : b === 'none' ? 1 : a - b))
      .map(([key, items]) => {
        const number = key === 'none' ? null : key;
        const episode = number === null ? null : byNumber.get(number) ?? null;
        const videos = items.filter((item) => item.kind === 'video');
        const busy = episode ? UPLOAD_BUSY.includes(latestUpload(episode)?.status) : false;

        const subs = items.filter((item) => item.kind === 'sub');
        const audios = items.filter((item) => item.kind === 'audio');
        const published = Boolean(episode?.sources?.some((source) => source.type === 'hls'));
        const repeated = subs.some((item, index) => subs.findIndex((other) => other.lang === item.lang) !== index);

        const problem =
          number === null ? 'Indica el número de episodio'
            : !episode ? `El episodio ${number} no existe en la lista`
              : busy ? 'Ya tiene una subida en curso'
                : videos.length > 1 ? 'Hay más de un video para este episodio'
                  : items.some((item) => item.kind !== 'video' && !LANG.test(item.lang)) ? 'Falta el idioma de algún subtítulo o audio'
                    : repeated ? 'Hay dos subtítulos en el mismo idioma'
                      : videos.length === 0 && audios.length > 0 && !published ? 'Para añadir un audio el episodio necesita su video publicado: suelta también el video'
                        : videos.length === 0 && audios.length > 1 ? 'Solo se puede añadir un audio por episodio a la vez: sube el otro después'
                          : null;

        return { number, episode, items, problem, replaces: videos.length > 0 && Boolean(episode?.sources?.length), addons: videos.length === 0 };
      });
  }, [view, byNumber]);

  const pending = groups.filter((group) => status[group.number]?.state !== 'done');
  const ready = pending.length > 0 && pending.every((group) => !group.problem);

  const total = pending.reduce((sum, group) => sum + group.items.reduce((s, item) => s + item.file.size, 0), 0);
  const percent = total ? Math.min(100, Math.round((sent / total) * 100)) : 0;

  const finished = groups.length > 0 && groups.every((group) => status[group.number]?.state === 'done');
  const failed = groups.filter((group) => status[group.number]?.state === 'error').length;

  const reset = () => {
    setFiles([]);
    setStatus({});
    setNotice(null);
    setSent(0);
    setPhase('idle');
  };

  const close = () => {
    if (uploading) return;
    reset();
    onClose();
  };

  // Un episodio detrás de otro: subir varios a la vez repartiría la conexión y los dejaría todos a medias.
  const start = async () => {
    setPhase('uploading');
    setSent(0);

    let done = 0;

    for (const group of pending) {
      const video = group.items.find((item) => item.kind === 'video');
      const extras = group.items.filter((item) => item.kind !== 'video');
      const ordered = video ? [video, ...extras] : [...extras].sort((x, y) => (x.kind === 'sub' ? -1 : 1) - (y.kind === 'sub' ? -1 : 1));
      const groupTotal = ordered.reduce((sum, item) => sum + item.file.size, 0);

      let created = null;
      let groupDone = 0;

      const progress = (loaded) => {
        setSent(done + groupDone + loaded);
        setStatus((prev) => ({ ...prev, [group.number]: { state: 'uploading', percent: Math.round(((groupDone + loaded) / groupTotal) * 100) } }));
      };

      setStatus((prev) => ({ ...prev, [group.number]: { state: 'uploading', percent: 0 } }));

      try {
        if (video) {
          // Episodio con video: un solo trabajo con todo lo que lleve (se convierte y publica entero).
          created = await uploads.create(group.episode.id, {
            filename: video.file.name,
            size: video.file.size,
            extras: extras.map((item) => ({ kind: item.kind, lang: item.lang, filename: item.file.name, size: item.file.size })),
            options,
          });

          for (let index = 0; index < ordered.length; index += 1) {
            await uploads.put(created.files[index].url, ordered[index].file, progress);
            groupDone += ordered[index].file.size;
          }

          await uploads.complete(created.id);
        } else {
          // Sin video: se añade a lo ya publicado. Los subtítulos se guardan al momento; el audio lo suma el servicio de conversión.
          const hasSubs = (group.episode.subtitles?.length ?? 0) > 0;
          const firstSub = ordered.find((other) => other.kind === 'sub');

          for (const item of ordered) {
            if (item.kind === 'sub') {
              await uploads.subtitle(group.episode.id, item.file, {
                language: item.lang,
                label: subtitleName(item.lang, item.lang),
                default: !hasSubs && firstSub === item,
              });
            } else {
              created = await uploads.createAudio(group.episode.id, { filename: item.file.name, size: item.file.size, language: item.lang, offset: 0 });
              await uploads.put(created.files[0].url, item.file, progress);
              await uploads.complete(created.id);
              created = null;
            }

            groupDone += item.file.size;
            setSent(done + groupDone);
          }
        }

        setStatus((prev) => ({ ...prev, [group.number]: { state: 'done', queued: Boolean(video) || ordered.some((item) => item.kind === 'audio') } }));
        onDone();
      } catch (err) {
        // Si se creó el trabajo pero la subida falló, no se deja a medias en el servidor.
        if (created) uploads.remove(created.id).catch(() => {});

        setStatus((prev) => ({ ...prev, [group.number]: { state: 'error', message: err.response?.data?.message ?? err.message } }));
      }

      done += groupTotal;
      setSent(done);
    }

    setPhase('idle');
  };

  const count = view.filter((item) => item.kind === 'video').length;

  return (
    <Dialog
      open={open}
      onClose={close}
      size="xl"
      title="Subir varios episodios (videos, subtítulos y audios)"
      actions={
        <>
          <Button color="ghost" size="sm" disabled={uploading} onClick={close}>{finished ? 'Cerrar' : 'Cancelar'}</Button>
          {!finished && (
            <Button size="sm" disabled={!ready} loading={uploading} onClick={start}>
              {failed ? 'Reintentar los que fallaron' : `Subir y publicar${pending.length ? ` (${pending.length})` : ''}`}
            </Button>
          )}
        </>
      }
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => !uploading && input.current?.click()}
        onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && !uploading && input.current?.click()}
        onDragOver={(event) => { event.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => { event.preventDefault(); setOver(false); if (!uploading) addFiles(event.dataTransfer.files); }}
        className={clsx(
          'flex cursor-pointer flex-col items-center gap-1 border-2 border-dashed px-4 py-7 text-center transition-colors',
          over ? 'border-accent bg-accent/10' : 'border-line bg-surface-2 hover:border-accent/60',
          uploading && 'pointer-events-none opacity-60',
        )}
      >
        <span className="text-sm font-semibold">
          {files.length ? `${files.length} ${files.length === 1 ? 'archivo' : 'archivos'}${count ? ` (${count} ${count === 1 ? 'video' : 'videos'})` : ''} · suelta más para añadirlos` : 'Suelta aquí los videos, subtítulos y audios de los episodios'}
        </span>
        <span className="text-xs text-muted">
          o haz clic para elegirlos. Cada archivo se asigna al episodio que indica su nombre (01.mkv, Serie - 05 [1080p].mkv, 05.es.srt, 05.lat.m4a…). Sin video, los subtítulos y audios se añaden al que el episodio ya tenga.
        </span>

        <input
          ref={input}
          type="file"
          multiple
          hidden
          accept={[...VIDEO, ...AUDIO, ...SUBS].join(',')}
          onChange={(event) => { addFiles(event.target.files); event.target.value = ''; }}
        />
      </div>

      {notice && <p className="text-xs text-red-400">{notice}</p>}

      {groups.length > 0 && (
        <ul className="flex max-h-[44vh] flex-col gap-3 overflow-y-auto pr-1">
          {groups.map((group) => {
            const state = status[group.number];
            const message = state?.state === 'error' ? state.message : state?.state === 'done' ? null : group.problem;

            return (
              <li key={group.number ?? 'none'} className={clsx('border bg-surface-2', message ? 'border-red-500/40' : 'border-line')}>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-3 py-2">
                  <span className="text-sm font-semibold">
                    {group.number === null ? 'Sin número' : `Episodio ${group.number}`}
                    {group.episode?.title ? <span className="font-normal text-muted"> · {group.episode.title}</span> : null}
                  </span>

                  {group.replaces && !state && <span className="bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-300">Reemplaza el video actual</span>}
                  {group.addons && !state && <span className="bg-surface px-1.5 py-0.5 text-[10px] text-muted">Se añade al video ya publicado</span>}
                  {state && (
                    <span className={clsx('px-1.5 py-0.5 text-[10px]', state.state === 'error' ? 'bg-red-500/15 text-red-400' : 'bg-accent/15 text-accent-text')}>
                      {state.state === 'done' ? (state.queued ? 'En cola' : 'Añadido') : STATE_LABEL[state.state]}{state.state === 'uploading' ? ` ${state.percent}%` : ''}
                    </span>
                  )}
                </div>

                {state?.state === 'uploading' && (
                  <div className="h-1 w-full bg-surface"><div className="h-full bg-accent transition-[width] duration-200" style={{ width: `${state.percent}%` }} /></div>
                )}

                <ul className="divide-y divide-line">
                  {group.items.map((item) => (
                    <li key={item.id} className="flex flex-wrap items-end gap-2 px-3 py-2">
                      <div className="min-w-0 flex-1 basis-48">
                        <p className="truncate text-xs font-semibold">{item.file.name}</p>
                        <p className="text-[11px] text-muted">{item.fromVideo ? 'Video · se extrae su audio' : KIND_LABEL[item.kind]} · {megabytes(item.file.size)}</p>
                      </div>

                      {item.kind !== 'video' && (
                        <div className="w-24">
                          <Input full size="sm" name={`lang-${item.id}`} label="Idioma" placeholder="es" value={item.lang} onChange={(event) => patch(item.id, { lang: event.target.value.trim().toLowerCase() })} disabled={uploading} />
                        </div>
                      )}

                      <div className="w-24">
                        <Input
                          full
                          size="sm"
                          type="number"
                          min="0"
                          name={`number-${item.id}`}
                          label="Episodio"
                          value={item.number ?? ''}
                          onChange={(event) => patch(item.id, { number: event.target.value === '' ? null : Number(event.target.value) })}
                          disabled={uploading || state?.state === 'done'}
                        />
                      </div>

                      <button
                        type="button"
                        disabled={uploading || state?.state === 'done'}
                        onClick={() => remove(item.id)}
                        aria-label={`Quitar ${item.file.name}`}
                        className="mb-1 px-2 text-sm text-muted transition-colors hover:bg-red-500/15 hover:text-red-400 disabled:opacity-40"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>

                {message && <p className="border-t border-line px-3 py-2 text-xs text-red-400">{message}</p>}
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-col gap-3 border border-line bg-surface-2 p-3">
        <label className="flex cursor-pointer items-start gap-2.5 text-sm">
          <input type="checkbox" className="mt-0.5 size-4 accent-accent" checked={audioOnly} onChange={(event) => setAudioOnly(event.target.checked)} disabled={uploading} />
          <span>
            <span className="font-semibold">Usar los videos solo para extraer su audio</span>
            <span className="block text-xs text-muted">
              En vez de publicarlos como episodios, se añade de cada video la pista del idioma indicado al episodio que ya tiene su video.
              La pista se reconoce por su etiqueta o título (p. ej. «Latino»); si no coincide ninguna, se usa la primera. Se sube el archivo entero.
            </span>
          </span>
        </label>

        {audioOnly && (
          <div className="w-40">
            <Input full size="sm" name="extractLang" label="Idioma a extraer" placeholder="lat" value={extractLang} onChange={(event) => setExtractLang(event.target.value.trim().toLowerCase())} disabled={uploading} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input full name="server" label="Nombre del servidor" value={options.server} onChange={(event) => setOptions((prev) => ({ ...prev, server: event.target.value }))} disabled={uploading} />
        <Input full name="audioLang" label="Idioma del audio (ja, es…)" value={options.audioLang} onChange={(event) => setOptions((prev) => ({ ...prev, audioLang: event.target.value.trim().toLowerCase() }))} disabled={uploading} />
        <Select full label="Tipo" value={options.language} onChange={(value) => setOptions((prev) => ({ ...prev, language: value }))} data={LANGUAGES} />
      </div>

      {uploading && (
        <div className="flex flex-col gap-1">
          <div className="h-2 w-full bg-surface-2"><div className="h-full bg-accent transition-[width] duration-200" style={{ width: `${percent}%` }} /></div>
          <p className="text-xs text-muted">
            Subiendo {percent}% · {megabytes(sent)} de {megabytes(total)}. No cierres esta pestaña hasta que termine.
          </p>
        </div>
      )}

      {finished && <p role="status" className="text-xs text-accent-text">Listo. Lo que lleva video o audio lo procesa el servicio de conversión en segundo plano y el estado aparece en cada episodio; los subtítulos ya están añadidos.</p>}
      {!finished && failed > 0 && !uploading && <p className="text-xs text-red-400">{failed} {failed === 1 ? 'episodio falló' : 'episodios fallaron'}: revisa el aviso en rojo y reintenta.</p>}
    </Dialog>
  )
}

export default BatchUploadDialog
