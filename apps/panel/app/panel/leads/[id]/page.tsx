import type { EventoHistorial } from '@kaizen/datos';
import { Insignia, Tarjeta, formatearFecha } from '@kaizen/ui';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { etapasDe, nombreEtapa, nombreResponsable, responsablesDe, type Contenido } from '@/lib/crm';
import { plantilla } from '@/lib/plantilla';
import { protegerPanel } from '@/lib/proteger';
import { AccionesLead } from './AccionesLead';

function describir(e: EventoHistorial, datos: Contenido): string {
  switch (e.tipo) {
    case 'creado':
      return `Lead creado desde ${e.detalle ?? 'formulario'}`;
    case 'etapa':
      return `Etapa: ${e.de ? nombreEtapa(datos, e.de) : '—'} → ${e.a ? nombreEtapa(datos, e.a) : '—'}`;
    case 'responsable':
      return `Responsable: ${e.de ? nombreResponsable(datos, e.de) : 'sin asignar'} → ${nombreResponsable(datos, e.a)}`;
    case 'nota':
      return `Nota: ${e.detalle ?? ''}`;
    default:
      return `${e.detalle ?? 'Campo'}: ${e.de ?? ''} → ${e.a ?? ''}`;
  }
}

export default async function DetalleLead({ params }: { params: Promise<{ id: string }> }) {
  await protegerPanel();
  const { id } = await params;
  const { datos } = await plantilla.obtenerContenido();
  const lead = await (await plantilla.capa()).leads.obtener(plantilla.sitioId(), id);
  if (!lead) notFound();

  return (
    <div className="grid gap-6">
      <Link href="/panel/leads" className="text-sm underline">
        ← Volver a leads
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl">{lead.nombre}</h1>
        <Insignia tono="primario">{nombreEtapa(datos, lead.etapa)}</Insignia>
        <Insignia>{lead.origen}</Insignia>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="grid gap-6">
          <Tarjeta>
            <h2 className="mb-3 text-lg">Datos</h2>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-suave">Teléfono</dt>
                <dd>{lead.contacto.telefono ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-suave">Correo</dt>
                <dd>{lead.contacto.correo ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-suave">Responsable</dt>
                <dd>{nombreResponsable(datos, lead.responsableId)}</dd>
              </div>
              <div>
                <dt className="text-suave">Creado</dt>
                <dd>{formatearFecha(lead.creadoEl)}</dd>
              </div>
              {Object.entries(lead.campos).map(([k, v]) =>
                v ? (
                  <div key={k}>
                    <dt className="text-suave">{k}</dt>
                    <dd>{String(v)}</dd>
                  </div>
                ) : null,
              )}
            </dl>
          </Tarjeta>
          <Tarjeta>
            <h2 className="mb-3 text-lg">Historial</h2>
            <ol className="grid gap-3 border-l-2 border-borde pl-4">
              {[...lead.historial].reverse().map((e, i) => (
                <li key={i} className="text-sm">
                  <p>{describir(e, datos)}</p>
                  <p className="text-xs text-suave">
                    {formatearFecha(e.fecha)} · {e.autor}
                  </p>
                </li>
              ))}
            </ol>
          </Tarjeta>
        </div>
        <AccionesLead
          id={lead.id}
          etapa={lead.etapa}
          responsableId={lead.responsableId ?? ''}
          etapas={etapasDe(datos).map((e) => ({ id: e.id, nombre: e.nombre }))}
          responsables={responsablesDe(datos).map((r) => ({ id: r.id, nombre: r.nombre }))}
        />
      </div>
    </div>
  );
}
