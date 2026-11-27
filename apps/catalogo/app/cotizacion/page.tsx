import { texto } from '@kaizen/ui';
import type { Metadata } from 'next';
import { Marco } from '@/componentes/Marco';
import { MiCotizacion } from '@/componentes/MiCotizacion';
import { leerCatalogo } from '@/lib/cotizacion';
import { plantilla } from '@/lib/plantilla';

export const metadata: Metadata = { title: 'Mi cotización', robots: { index: false, follow: false } };

export default async function PaginaCotizacion({ searchParams }: { searchParams: Promise<{ vista?: string }> }) {
  const { vista } = await searchParams;
  const { datos, estado } = await plantilla.obtenerContenido({ vista });
  const { productos, condiciones } = leerCatalogo(datos);
  const t = (datos.cotizacion ?? {}) as Record<string, unknown>;
  return (
    <Marco datos={datos} estado={estado}>
      <div className="k-contenedor k-seccion">
        <h1 className="mb-8 text-3xl md:text-4xl">{texto(t.titulo, 'Mi cotización')}</h1>
        <MiCotizacion
          productos={productos}
          condiciones={condiciones}
          textos={{
            titulo: texto(t.titulo, 'Mi cotización'),
            textoVacio: texto(t.textoVacio, 'Todavía no has agregado productos.'),
            textoBoton: texto(t.textoBoton, 'Recibir mi cotización'),
            mensajeExito: texto(t.mensajeExito, '¡Listo! Esta es tu cotización.'),
          }}
        />
      </div>
    </Marco>
  );
}
