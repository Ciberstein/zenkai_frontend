import React from 'react'
import { useSelector } from 'react-redux'
import { API_ROUTES } from '../../../api/routes'
import api from '../../../api/axios'
import Brand from '../../shared/Brand'

// ─── PosterWall ───────────────────────────────────────────────────────────────

// Tres columnas de portadas que suben y bajan a distinta velocidad, inclinadas
// unos grados. Cada columna se duplica para que el bucle no tenga salto. Es
// decoracion pura: va oculta para lectores de pantalla y no se pinta en movil.
const PosterWall = ({ posters = [] }) => {

  if (posters.length < 6) return null;

  const columns = [0, 1, 2].map((offset) =>
    posters.filter((_, index) => index % 3 === offset),
  );
  const motion = ['animate-marquee-up', 'animate-marquee-down', 'animate-marquee-up'];
  const spacing = ['', 'mt-16', 'mt-6'];

  return (
    <div aria-hidden="true" className="absolute inset-0 flex -rotate-9 scale-[1.35] justify-center gap-5">
      {columns.map((column, index) => (
        <div key={index} className={`flex w-48 flex-col gap-5 ${spacing[index]} ${motion[index]}`}>
          {[...column, ...column].map((src, position) => (
            <img
              key={position}
              src={src}
              alt=""
              loading="lazy"
              className="cut aspect-2/3 w-full object-cover"
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── AuthShell ────────────────────────────────────────────────────────────────

// Marco comun de las tres pantallas de acceso. Vive aqui y no en layouts/
// porque solo lo usa este grupo de rutas.
const AuthShell = ({ title, subtitle, children, footer = null }) => {

  const [posters, setPosters] = React.useState([]);
  const config = useSelector(state => state.config);

  React.useEffect(() => {
    api.get(`${API_ROUTES.PUBLIC}/catalog/top`, { params: { limit: 24 } })
      .then((res) => setPosters((res.data?.data ?? []).map((anime) => anime.image).filter(Boolean)))
      .catch(() => setPosters([]));
  }, []);

  return (
    <div className="dark grid min-h-screen bg-bg text-fg lg:grid-cols-[1.15fr_1fr]">
      {/* Panel de marca (solo escritorio). */}
      <aside className="relative hidden overflow-hidden bg-ink-950 lg:block">
        <PosterWall posters={posters} />
        <div aria-hidden="true" className="grid-hud absolute inset-0" />

        <div aria-hidden="true" className="absolute inset-0 bg-linear-to-r from-ink-950/30 via-transparent to-bg" />
        <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-ink-950 via-ink-950/40 to-ink-950/70" />

        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <Brand name={config?.['project_name'] ?? 'Zenkai'} />

          <div className="flex max-w-md flex-col gap-4">
            <p lang="ja" aria-hidden="true" className="font-jp text-sm font-bold tracking-[0.4em] text-accent-text">全開</p>
            <p className="font-display-tight text-5xl font-bold xl:text-6xl">
              Tu próxima serie favorita empieza aquí.
            </p>
            <p className="text-[15px] text-fg/65">
              Sigue lo que ves, guarda lo que quieres ver y retoma cada episodio justo donde lo dejaste.
            </p>
          </div>
        </div>
      </aside>

      {/* Formulario. */}
      <main className="relative flex items-center justify-center overflow-hidden px-5 py-12 sm:px-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 size-140 -translate-x-1/2 -translate-y-1/2 bg-accent/15 blur-[130px] lg:hidden"
        />

        <div className="relative w-full max-w-104 animate-fade-up">
          <Brand name={config?.['project_name'] ?? 'Zenkai'} className="mb-10 lg:hidden" />

          <div className="mb-8 flex flex-col gap-2">
            <h1 className="font-display-tight text-4xl font-bold">{title}</h1>
            {subtitle && <p className="text-[15px] text-muted">{subtitle}</p>}
          </div>

          {children}

          {footer && (
            <div className="mt-8 border-t border-line pt-6 text-center text-sm leading-7 text-muted">{footer}</div>
          )}
        </div>
      </main>
    </div>
  )
}

export default AuthShell
