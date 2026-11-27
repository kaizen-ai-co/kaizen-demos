import { TablaEstados, texto } from '@kaizen/ui';
import { Catalogo } from '@/componentes/Interactivos';
import { Marco } from '@/componentes/Marco';
import { leerCatalogo } from '@/lib/cotizacion';
import { plantilla } from '@/lib/plantilla';

export default async function Inicio({ searchParams }: { searchParams: Promise<{ vista?: string }> }) {
  const { vista } = await searchParams;
  const { datos, estado } = await plantilla.obtenerContenido({ vista });
  const { productos, categorias, condiciones } = leerCatalogo(datos);
  const portada = (datos.portada ?? {}) as Record<string, unknown>;
  const cat = (datos.catalogo ?? {}) as Record<string, unknown>;

  return (
    <Marco datos={datos} estado={estado}>
      <section className="border-b border-borde bg-superficie py-10 md:py-14">
        <div className="k-contenedor max-w-3xl text-center">
          <h1 className="text-3xl md:text-5xl">{texto(portada.titulo, 'Catálogo')}</h1>
          {texto(portada.subtitulo) && <p className="mt-4 text-lg text-suave">{texto(portada.subtitulo)}</p>}
        </div>
      </section>
      <section className="k-seccion" aria-label={texto(cat.textoSeccionProductos, 'Productos')}>
        <div className="k-contenedor">
          <Catalogo
            productos={productos}
            categorias={categorias}
            moneda={condiciones.moneda ?? 'COP'}
            textos={{
              buscar: texto(cat.textoBuscar, 'Buscar productos'),
              todas: texto(cat.textoTodas, 'Todas'),
              agregar: texto(cat.textoAgregar, 'Agregar a la cotización'),
              agotado: texto(cat.textoAgotado, 'No disponible'),
              agregado: texto(cat.textoAgregado, 'Agregado'),
              sinResultados: texto(cat.textoSinResultados, 'No encontramos productos con ese filtro.'),
              filtrarCategorias: texto(cat.textoFiltrarCategorias, 'Filtrar por categoría'),
            }}
          />
        </div>
      </section>
      <TablaEstados funciones={plantilla.config.funciones ?? []} />
    </Marco>
  );
}
