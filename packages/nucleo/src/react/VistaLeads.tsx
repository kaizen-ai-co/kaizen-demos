import type { Lead } from '@kaizen/datos';
import { Insignia, formatearFecha } from '@kaizen/ui';

/** Vista "Leads" de solo lectura para el editor (plantillas 1, 2 y 4). */
export function VistaLeads({ leads, mostrarExtra = false }: { leads: Lead[]; mostrarExtra?: boolean }) {
  if (!leads.length) {
    return <p className="text-sm text-suave">Todavía no hay leads. Envía el formulario de la página pública para probar el recorrido.</p>;
  }
  return (
    <div className="grid gap-2">
      <p className="text-xs text-suave">{leads.length} lead(s) · solo lectura · datos ficticios</p>
      <ul className="grid gap-2">
        {leads.map((l) => (
          <li key={l.id} className="rounded-md border border-borde p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <strong>{l.nombre}</strong>
              <Insignia tono={l.etapa === 'nuevo' ? 'primario' : 'neutro'}>{l.etapa}</Insignia>
            </div>
            <p className="text-suave">{[l.contacto.correo, l.contacto.telefono].filter(Boolean).join(' · ')}</p>
            <p className="text-xs text-suave">{formatearFecha(l.creadoEl)} · {l.origen}</p>
            {Object.keys(l.campos).length > 0 && (
              <dl className="mt-2 grid gap-0.5 text-xs">
                {Object.entries(l.campos).map(([k, v]) => v ? <div key={k}><dt className="inline font-semibold">{k}: </dt><dd className="inline">{String(v)}</dd></div> : null)}
              </dl>
            )}
            {mostrarExtra && l.extra && (
              <pre className="mt-2 overflow-x-auto rounded bg-superficie p-2 text-[11px]">{JSON.stringify(l.extra, null, 2)}</pre>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
