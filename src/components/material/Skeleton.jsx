import clsx from 'clsx';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

// El estado de carga lo anuncia el contenedor con aria-busy, no cada bloque.
export const Skeleton = ({ className = '', ...props }) => (
  <div
    {...props}
    aria-hidden="true"
    className={clsx('skeleton', className)}
  />
);

// Rejilla de portadas con la misma forma que las tarjetas reales, para que el
// diseno no salte cuando llegan los datos.
export const PosterGridSkeleton = ({ count = 12 }) => (
  <div
    aria-busy="true"
    aria-label="Cargando catálogo"
    className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
  >
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="flex flex-col gap-2.5">
        <Skeleton className="aspect-2/3 w-full" />
        <Skeleton className="h-3 w-4/5 " />
        <Skeleton className="h-2.5 w-2/5 " />
      </div>
    ))}
  </div>
);

// Esqueleto de la portada de inicio: mismas proporciones que el hero real.
export const HeroSkeleton = () => (
  <div aria-busy="true" aria-label="Cargando" className="flex flex-col gap-10">
    <div className="-mt-(--nav-h) h-[78vh] min-h-130 w-full skeleton " />
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="aspect-2/3 w-44 shrink-0" />
      ))}
    </div>
  </div>
);

export default Skeleton;
