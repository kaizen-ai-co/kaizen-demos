import { Boton, Entrada, Insignia, Selector, Tarjeta, cn, formatearFecha } from '@kaizen/ui';
import { TONOS, etapasDe, nombreEtapa, nombreResponsable, responsablesDe } from '@/lib/crm';
import { plantilla } from '@/lib/plantilla';
import { protegerPanel } from '@/lib/proteger';

/** Lista de leads con filtros (formulario GET: funciona sin JavaScript). */
export default async function Leads({ searchParams }: { searchParams: Promise<{ etapa?: string; responsable?: string; q?: string }> }) {
  await protegerPanel();
  const f = await searchParams;
  const { datos } = await plantilla.obtenerContenido();
  const leads = await (await plantilla.capa()).leads.listar(plantilla.sitioId(), {
    etapa: f.etapa || undefined,
    responsableId: f.responsable || undefined,
    texto: f.q || undefined,
  });
  const etapas = etapasDe(datos);

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl">Leads</h1>
      <form method="get" className="grid gap-3 rounded-lg border border-borde bg-fondo p-4 md:grid-cols-[1fr_12rem_12rem_auto]">
        <label className="grid gap-1 text-sm">Buscar<Entrada name="q" defaultValue={f.q ?? ''} placeholder="Nombre, correo, teléfono u origen" /></label>
        <label className="grid gap-1 text-sm">Etapa
          <Selector name="etapa" defaultValue={f.etapa ?? ''}>
            <option value="">Todas</option>
            {etapas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </Selector>
        </label>
        <label className="grid gap-1 text-sm">Responsable
          <Selector name="responsable" defaultValue={f.responsable ?? ''}>
            <option value="">Todos</option>
            {responsablesDe(datos).map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </Selector>
        </label>
        <div className="flex items-end gap-2"><Boton type="submit">Filtrar</Boton><a href="/panel/leads" className="px-2 py-2 text-sm underline">Limpiar</a></div>
      </form>

      <p className="text-sm text-suave" aria-live="polite">{leads.length} resultado(s)</p>
      {leads.length === 0 ? (
        <Tarjeta><p className="text-suave">No hay leads con esos filtros.</p></Tarjeta>
      ) : (
        <ul className="grid gap-2">
          {leads.map((l) => {
            const etapa = etapas.find((e) => e.id === l.etapa);
            return (
              <li key={l.id}>
                <a href={`/panel/leads/${l.id}`} className="grid gap-1 rounded-lg border border-borde bg-fondo p-4 hover:shadow-md md:grid-cols-[1fr_10rem_12rem_10rem] md:items-center">
                  <span>
                    <strong className="block">{l.nombre}</strong>
                    <span className="text-sm text-suave">{[l.contacto.telefono, l.contacto.correo].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span className="flex items-center gap-2 text-sm">
                    <span aria-hidden className={cn('size-2.5 rounded-full', TONOS[etapa?.color ?? 'neutro'])} />
                    {nombreEtapa(datos, l.etapa)}
                  </span>
                  <span className="text-sm">{nombreResponsable(datos, l.responsableId)}</span>
                  <span className="text-xs text-suave">{formatearFecha(l.creadoEl)} <Insignia className="ml-1">{l.origen}</Insignia></span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
