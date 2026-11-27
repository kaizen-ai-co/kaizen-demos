import { tienePermiso } from '@kaizen/datos';
import { PaginaEditar } from '@kaizen/nucleo/react';
import { Insignia, formatearFecha } from '@kaizen/ui';
import type { Metadata } from 'next';
import { serviciosDe } from '@/lib/agenda';
import { plantilla } from '@/lib/plantilla';
import EditorAgenda from './EditorAgenda';

export const metadata: Metadata = { title: 'Editar demo', robots: { index: false, follow: false } };

export default function Editar() {
  return (
    <PaginaEditar
      plantilla={plantilla}
      editor={EditorAgenda}
      vistas={async (usuario) => {
        if (!tienePermiso(usuario, 'citas:gestionar')) return [];
        const { datos } = await plantilla.obtenerContenido();
        const ahora = new Date();
        const citas = await (await plantilla.capa()).citas.listarRango(plantilla.sitioId(), ahora.toISOString(), new Date(ahora.getTime() + 30 * 864e5).toISOString());
        const servicio = (id: string) => serviciosDe(datos).find((s) => s.id === id)?.nombre ?? id;
        return [
          {
            id: 'citas',
            titulo: `Citas (${citas.length})`,
            contenido: (
              <div className="grid gap-3">
                <a href="/calendario" className="text-sm font-semibold text-primario underline">Abrir el calendario semanal →</a>
                {citas.length === 0 ? <p className="text-sm text-suave">No hay citas en los próximos 30 días.</p> : (
                  <ul className="grid gap-2">
                    {citas.map((c) => (
                      <li key={c.id} className="rounded-md border border-borde p-3 text-sm">
                        <div className="flex justify-between gap-2"><strong>{c.visitante.nombre}</strong><Insignia tono={c.estado === 'confirmada' ? 'exito' : c.estado === 'cancelada' ? 'peligro' : 'aviso'}>{c.estado}</Insignia></div>
                        <p className="text-suave">{servicio(c.servicioId)} · {formatearFecha(c.inicio)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ),
          },
        ];
      }}
    />
  );
}
