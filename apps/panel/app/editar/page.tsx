import { tienePermiso } from '@kaizen/datos';
import { PaginaEditar, VistaLeads } from '@kaizen/nucleo/react';
import type { Metadata } from 'next';
import { plantilla } from '@/lib/plantilla';

export const metadata: Metadata = { title: 'Editar demo', robots: { index: false, follow: false } };

export default function Editar() {
  return (
    <PaginaEditar
      plantilla={plantilla}
      vistas={async (usuario) => {
        if (!tienePermiso(usuario, 'leads:leer')) return [];
        const leads = await (await plantilla.capa()).leads.listar(plantilla.sitioId());
        return [
          {
            id: 'leads',
            titulo: `Leads (${leads.length})`,
            contenido: (
              <div className="grid gap-3">
                <a href="/panel" className="text-sm font-semibold text-primario underline">Abrir el panel completo →</a>
                <VistaLeads leads={leads} />
              </div>
            ),
          },
        ];
      }}
    />
  );
}
