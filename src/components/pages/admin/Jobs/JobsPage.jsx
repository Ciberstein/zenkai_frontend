import React from 'react'
import { useSelector } from 'react-redux'
import jobs_service from '../../../../services/jobs.services'
import { Button, Skeleton, Tag } from '../../../material'
import Icon from '../../../shared/Icon'
import NoData from '../../../shared/NoData'
import PageHeader from '../../../shared/PageHeader'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS = {
  running: { label: 'En curso', color: 'accent' },
  done: { label: 'Correcta', color: 'soft' },
  error: { label: 'Con error', color: 'danger' },
  idle: { label: 'Sin ejecutar', color: 'outline' },
};

const POLL_RUNNING_MS = 4000;
const POLL_IDLE_MS = 60000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const relative = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

// "hace 3 h", "mañana"… Se elige la unidad mas grande que no pase de 1.
const ago = (date) => {
  if (!date) return null;

  const seconds = Math.round((new Date(date).getTime() - Date.now()) / 1000);
  const steps = [['day', 86400], ['hour', 3600], ['minute', 60]];

  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }

  return relative.format(seconds, 'second');
};

const stamp = (date) =>
  date
    ? new Date(date).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null;

const duration = (start, end) => {
  if (!start || !end) return null;

  const seconds = Math.max(Math.round((new Date(end) - new Date(start)) / 1000), 0);
  return seconds >= 60 ? `${Math.floor(seconds / 60)} min ${seconds % 60} s` : `${seconds} s`;
};

// ─── Detail ───────────────────────────────────────────────────────────────────

const Detail = ({ label, children }) => {
  if (!children) return null;

  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
};

// ─── JobsPage ─────────────────────────────────────────────────────────────────

export const JobsPage = () => {

  const [items, setItems] = React.useState(null);
  const [failed, setFailed] = React.useState(false);
  const [notice, setNotice] = React.useState(null);

  const account = useSelector(state => state.account);
  const canRun = account?.authority >= 40000;

  const load = React.useCallback(async () => {
    try {
      setItems(await jobs_service.list());
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  const anyRunning = items?.some((job) => job.running) ?? false;

  // Sondeo: rapido mientras algo corre, lento el resto del tiempo (la proxima
  // ejecucion y el resultado cambian solos aunque nadie pulse nada).
  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    const timer = setTimeout(load, anyRunning ? POLL_RUNNING_MS : POLL_IDLE_MS);
    return () => clearTimeout(timer);
  }, [items, anyRunning, load]);

  const run = async (job) => {
    setNotice(null);

    try {
      await jobs_service.run(job.name);
      // Se marca ya como en curso sin esperar al siguiente sondeo.
      setItems((prev) => prev.map((item) => (
        item.name === job.name ? { ...item, running: true, status: 'running', message: null } : item
      )));
      setTimeout(load, 1200);
    } catch (err) {
      setNotice(
        err.response?.status === 409
          ? `«${job.label}» ya se está ejecutando.`
          : 'No se pudo iniciar la tarea. Revisa los logs del servidor.',
      );
      load();
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Sistema"
        title="Tareas programadas"
        description="El catálogo se actualiza solo con estas tareas. Puedes lanzar cualquiera a mano si no quieres esperar."
      />

      {notice && (
        <p role="alert" className="border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">
          {notice}
        </p>
      )}

      {!canRun && items && (
        <p className="border border-line bg-surface/60 px-4 py-3 text-sm text-muted">
          Solo los administradores pueden ejecutar tareas manualmente.
        </p>
      )}

      {failed && !items && <NoData message="No se pudieron cargar las tareas. Inténtalo de nuevo en unos segundos." />}

      {!items && !failed && (
        <div aria-busy="true" className="flex flex-col gap-3">
          {[0, 1, 2, 3, 4].map((key) => <Skeleton key={key} className="h-32 w-full" />)}
        </div>
      )}

      {items && (
        <ul className="stagger flex flex-col gap-3">
          {items.map((job) => {
            const status = STATUS[job.status] ?? STATUS.idle;
            const took = duration(job.startedAt, job.finishedAt);

            return (
              <li key={job.name} className="hud flex flex-col gap-5 border border-line bg-surface/60 p-5 md:flex-row md:items-start md:justify-between">
                <div className="flex min-w-0 flex-1 flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-sans text-base font-semibold tracking-normal">{job.label}</h2>

                      <Tag color={status.color}>
                        {job.running && <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-current" />}
                        {status.label}
                      </Tag>
                    </div>

                    <p className="max-w-2xl text-sm text-muted">{job.description}</p>
                  </div>

                  <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Detail label="Horario">{job.schedule}</Detail>

                    <Detail label="Última ejecución">
                      {job.running
                        ? `Empezó ${ago(job.startedAt)}`
                        : job.finishedAt && (
                          <>
                            {ago(job.finishedAt)}
                            <span className="block text-xs text-muted">{stamp(job.finishedAt)}{took && ` · duró ${took}`}</span>
                          </>
                        )}
                    </Detail>

                    <Detail label="Próxima ejecución">
                      {job.nextRun && <>{ago(job.nextRun)}<span className="block text-xs text-muted">{stamp(job.nextRun)}</span></>}
                    </Detail>

                    <Detail label="Resultado">
                      {job.message && <span className={job.status === 'error' ? 'text-red-400' : undefined}>{job.message}</span>}
                    </Detail>
                  </dl>
                </div>

                <Button
                  color="outline"
                  size="md"
                  loading={job.running}
                  disabled={!canRun}
                  onClick={() => run(job)}
                  icon={!job.running && <Icon name="play" className="size-4" />}
                  title={canRun ? undefined : 'Solo los administradores pueden ejecutar tareas'}
                >
                  {job.running ? 'En curso…' : 'Ejecutar ahora'}
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
