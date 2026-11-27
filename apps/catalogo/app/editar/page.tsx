import { tienePermiso } from '@kaizen/datos';
import { PaginaEditar } from '@kaizen/nucleo/react';
import type { Metadata } from 'next';
import { VistaCotizaciones, VistaImportarCsv } from '@/componentes/VistasEditor';
import { leerCatalogo } from '@/lib/cotizacion';
import { plantilla } from '@/lib/plantilla';

export const metadata: Metadata = { title: 'Editar demo', robots: { index: false, follow: false } };

export default function Editar() {
  return (
    <PaginaEditar
      plantilla={plantilla}
      vistas={async (usuario) => {
        const vistas = [];
        if (tienePermiso(usuario, 'cotizaciones:leer')) {
          const capa = await plantilla.capa();
          const cotizaciones = await capa.cotizaciones.listar(plantilla.sitioId());
          const { datos } = await plantilla.obtenerContenido();
          vistas.push({
            id: 'cotizaciones',
            titulo: `Cotizaciones (${cotizaciones.length})`,
            contenido: (
              <VistaCotizaciones cotizaciones={cotizaciones} moneda={leerCatalogo(datos).condiciones.moneda ?? 'COP'} />
            ),
          });
        }
        vistas.push({ id: 'importar', titulo: 'Importar CSV', contenido: <VistaImportarCsv /> });
        return vistas;
      }}
    />
  );
}
