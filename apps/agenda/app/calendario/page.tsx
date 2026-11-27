import { tienePermiso } from '@kaizen/datos';
import { AvisoDemo, Insignia, cn } from '@kaizen/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { fechaBogota, instanteBogota, lunesDe, profesionalesDe, serviciosDe, sumarDias } from '@/lib/agenda';
import { plantilla } from '@/lib/plantilla';
import { EstadoCita } from './EstadoCita';

export const metadata: Metadata = { title: 'Calendario', robots: { index: false, follow: false } };

const fmt = (iso: string, o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', ...o }).format(new Date(iso));

/** Calendario semanal protegido: citas por día con su estado (el equipo lo puede cambiar). */
export default async function Calendario({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string; profesional?: string }>;
}) {
  const acceso = await plantilla.accesoActual();
  if (!acceso.ok || !tienePermiso(acceso.usuario, 'citas:gestionar')) redirect('/editar');

  const { semana, profesional } = await searchParams;
  // eslint-disable-next-line react-hooks/purity -- Server Component async: se renderiza una vez por solicitud.
  const hoy = fechaBogota(Date.now());
  const lunes = lunesDe(/^\d{4}-\d{2}-\d{2}$/.test(semana ?? '') ? semana! : hoy);
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
  const { datos } = await plantilla.obtenerContenido();
  const profesionales = profesionalesDe(datos);
  const citas = await (
    await plantilla.capa()
  ).citas.listarRango(
    plantilla.sitioId(),
    new Date(instanteBogota(lunes, 0)).toISOString(),
    new Date(instanteBogota(sumarDias(lunes, 7), 0)).toISOString(),
    profesional || undefined,
  );
  const servicio = (id: string) => serviciosDe(datos).find((s) => s.id === id)?.nombre ?? id;
  const nombreProf = (id: string) => profesionales.find((p) => p.id === id)?.nombre ?? id;
  const enlace = (s: string) => `/calendario?semana=${s}${profesional ? `&profesional=${profesional}` : ''}`;

  return (
    <div className="min-h-dvh bg-superficie">
      <AvisoDemo />
      <header className="border-b border-borde bg-fondo">
        <div className="k-contenedor flex flex-wrap items-center gap-3 py-3">
          <strong>Calendario</strong>
          <nav aria-label="Semana" className="flex items-center gap-2 text-sm">
            <a className="rounded-md border border-borde px-3 py-1.5" href={enlace(sumarDias(lunes, -7))}>
              ← Anterior
            </a>
            <a className="rounded-md border border-borde px-3 py-1.5" href={enlace(lunesDe(hoy))}>
              Hoy
            </a>
            <a className="rounded-md border border-borde px-3 py-1.5" href={enlace(sumarDias(lunes, 7))}>
              Siguiente →
            </a>
          </nav>
          <form method="get" className="flex items-center gap-2 text-sm">
            <input type="hidden" name="semana" value={lunes} />
            <label className="sr-only" htmlFor="f-prof">
              Profesional
            </label>
            <select
              id="f-prof"
              name="profesional"
              defaultValue={profesional ?? ''}
              className="h-9 rounded-md border border-borde bg-fondo px-2"
            >
              <option value="">Todos los profesionales</option>
              {profesionales.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
            <button type="submit" className="h-9 rounded-md bg-primario px-3 text-primario-texto">
              Ver
            </button>
          </form>
          <span className="ml-auto flex gap-3 text-sm">
            <Link className="underline" href="/editar">
              Editar
            </Link>
            <Link className="underline" href="/">
              Reservar
            </Link>
          </span>
        </div>
      </header>
      <main id="contenido" tabIndex={-1} className="k-contenedor py-6">
        <h1 className="mb-4 text-2xl">
          Semana del {fmt(`${lunes}T12:00:00-05:00`, { day: 'numeric', month: 'long' })}
        </h1>
        <div className="grid gap-3 md:grid-cols-7">
          {dias.map((d) => {
            const delDia = citas.filter((c) => fechaBogota(Date.parse(c.inicio)) === d);
            return (
              <section
                key={d}
                aria-label={fmt(`${d}T12:00:00-05:00`, { weekday: 'long', day: 'numeric', month: 'long' })}
                className={cn('rounded-lg border border-borde bg-fondo p-3', d === hoy && 'ring-2 ring-primario')}
              >
                <h2 className="mb-2 text-sm font-semibold capitalize">
                  {fmt(`${d}T12:00:00-05:00`, { weekday: 'short', day: 'numeric' })}
                </h2>
                {delDia.length === 0 ? (
                  <p className="text-xs text-suave">Sin citas</p>
                ) : (
                  <ul className="grid gap-2">
                    {delDia.map((c) => (
                      <li
                        key={c.id}
                        className={cn(
                          'rounded-md border border-borde p-2 text-xs',
                          c.estado === 'cancelada' && 'opacity-60',
                        )}
                      >
                        <p className="font-semibold">
                          {fmt(c.inicio, { hour: 'numeric', minute: '2-digit' })} –{' '}
                          {fmt(c.fin, { hour: 'numeric', minute: '2-digit' })}
                        </p>
                        <p>{c.visitante.nombre}</p>
                        <p className="text-suave">
                          {servicio(c.servicioId)} · {nombreProf(c.profesionalId)}
                        </p>
                        <div className="mt-1 flex items-center gap-1">
                          <Insignia
                            tono={c.estado === 'confirmada' ? 'exito' : c.estado === 'cancelada' ? 'peligro' : 'aviso'}
                          >
                            {c.estado}
                          </Insignia>
                        </div>
                        <EstadoCita id={c.id} estado={c.estado} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
