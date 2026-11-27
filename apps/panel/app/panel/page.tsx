import { Tarjeta, cn } from '@kaizen/ui';
import { TONOS, calcularMetricas } from '@/lib/crm';
import { plantilla } from '@/lib/plantilla';
import { protegerPanel } from '@/lib/proteger';
import { CargarEjemplos } from './CargarEjemplos';

function Barras({ titulo, filas }: { titulo: string; filas: { id: string; nombre: string; cantidad: number; color?: string }[] }) {
  const max = Math.max(1, ...filas.map((f) => f.cantidad));
  return (
    <Tarjeta>
      <h2 className="mb-4 text-lg">{titulo}</h2>
      <ul className="grid gap-3">
        {filas.map((f) => (
          <li key={f.id} className="grid gap-1">
            <div className="flex justify-between text-sm"><span>{f.nombre}</span><span className="font-semibold tabular-nums">{f.cantidad}</span></div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-secundario" role="presentation">
              <div className={cn('h-full rounded-full', TONOS[f.color ?? 'primario'] ?? 'bg-primario')} style={{ width: `${(f.cantidad / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </Tarjeta>
  );
}

export default async function Resumen() {
  await protegerPanel();
  const { datos } = await plantilla.obtenerContenido();
  const leads = await (await plantilla.capa()).leads.listar(plantilla.sitioId());
  const m = calcularMetricas(leads, datos);
  const abiertos = m.porEtapa.filter((e) => !(datos.etapas as { lista?: { id: string; cerrada?: boolean }[] })?.lista?.find((x) => x.id === e.id)?.cerrada).reduce((s, e) => s + e.cantidad, 0);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl">Resumen</h1>
        <CargarEjemplos />
      </div>
      <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          ['Leads totales', m.total],
          ['Abiertos', abiertos],
          ['Sin asignar', m.sinAsignar],
          ['Responsables', m.porResponsable.length],
        ].map(([k, v]) => (
          <Tarjeta key={k} className="p-4">
            <dt className="text-sm text-suave">{k}</dt>
            <dd className="text-3xl font-bold tabular-nums">{v}</dd>
          </Tarjeta>
        ))}
      </dl>
      {m.total === 0 ? (
        <Tarjeta><p className="text-suave">{(datos.panel as { mensajeVacio?: string })?.mensajeVacio}</p></Tarjeta>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Barras titulo="Leads por etapa" filas={m.porEtapa} />
          <Barras titulo="Leads por responsable" filas={[...m.porResponsable, ...(m.sinAsignar ? [{ id: '_sin', nombre: 'Sin asignar', cantidad: m.sinAsignar, color: 'neutro' }] : [])]} />
        </div>
      )}
    </div>
  );
}
