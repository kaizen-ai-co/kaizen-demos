import { tienePermiso } from '@kaizen/datos';
import { PaginaEditar, VistaLeads } from '@kaizen/nucleo/react';
import type { Metadata } from 'next';
import { plantilla } from '@/lib/plantilla';
import EditorVisor from './EditorVisor';

export const metadata: Metadata = { title: 'Editar demo', robots: { index: false, follow: false } };

export default function Editar() {
  return (
    <PaginaEditar
      plantilla={plantilla}
      editor={EditorVisor}
      vistas={async (usuario) => {
        if (!tienePermiso(usuario, 'leads:leer')) return [];
        const leads = await (await plantilla.capa()).leads.listar(plantilla.sitioId());
        return [
          {
            id: 'leads',
            titulo: `Configuraciones pedidas (${leads.length})`,
            contenido: <VistaLeads leads={leads} mostrarExtra />,
          },
        ];
      }}
    />
  );
}
