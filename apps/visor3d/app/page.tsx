import { AvisoDemo, Insignia, TablaEstados, img, lista, texto } from '@kaizen/ui';
import { Encabezado, Pie } from '@kaizen/ui/bloques';
import { Configurador } from '@/componentes/Configurador';
import { plantilla } from '@/lib/plantilla';
import { normalizarEscena, normalizarPartes, normalizarVista } from '@/lib/tipos';

type Datos = Record<string, Record<string, unknown>>;

/** Página pública del visor: lee solo lo publicado (o el borrador en la vista previa con sesión). */
export default async function Inicio({ searchParams }: { searchParams: Promise<{ vista?: string }> }) {
  const { vista } = await searchParams;
  const { datos: crudos, estado, secciones } = await plantilla.obtenerContenido({ vista });
  const datos = crudos as unknown as Datos;
  const visibles = new Set(secciones.map((s) => s.id));
  const { portada, modelo, solicitud, ayuda } = datos;
  const archivo = modelo?.archivo as { url?: string } | null;

  return (
    <>
      <AvisoDemo />
      {estado === 'borrador' && (
        <p className="bg-secundario py-1 text-center text-xs text-secundario-texto">Vista previa del borrador</p>
      )}
      {visibles.has('encabezado') && <Encabezado datos={datos.encabezado ?? {}} />}
      <main>
        <section className="k-contenedor py-10 md:py-14">
          {texto(portada?.etiqueta) && (
            <Insignia tono="primario" className="mb-3">
              {texto(portada?.etiqueta)}
            </Insignia>
          )}
          <h1 className="max-w-3xl text-3xl tracking-tight md:text-5xl">
            {texto(portada?.titulo, 'Personaliza tu producto')}
          </h1>
          {texto(portada?.subtitulo) && (
            <p className="mt-4 max-w-2xl text-lg text-suave">{texto(portada?.subtitulo)}</p>
          )}
        </section>
        <Configurador
          producto={{
            nombre: texto(modelo?.nombreProducto, 'Producto'),
            descripcion: texto(modelo?.descripcion) || undefined,
          }}
          modeloUrl={archivo?.url || undefined}
          partes={normalizarPartes(datos.partes?.partes)}
          vista={normalizarVista(datos.camara?.camaraInicial)}
          escena={normalizarEscena(datos.escena)}
          imagenReserva={img(modelo?.imagenReserva, 'Imagen del producto')}
          ayuda={
            visibles.has('ayuda')
              ? {
                  instrucciones: texto(ayuda?.instrucciones),
                  consejos: lista<{ texto: string }>(ayuda?.consejos).map((c) => c.texto),
                }
              : null
          }
          solicitud={{
            titulo: texto(solicitud?.titulo, 'Solicitar esta configuración'),
            subtitulo: texto(solicitud?.subtitulo) || undefined,
            textoBoton: texto(solicitud?.textoBoton, 'Solicitar esta configuración'),
            mensajeExito: texto(solicitud?.mensajeExito, '¡Recibido! Te escribimos pronto.'),
          }}
        />
      </main>
      {visibles.has('pie') && <Pie datos={datos.pie ?? {}} />}
      <TablaEstados funciones={plantilla.config.funciones ?? []} />
    </>
  );
}
