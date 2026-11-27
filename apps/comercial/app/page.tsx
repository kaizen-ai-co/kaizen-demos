import { AvisoDemo, TablaEstados } from '@kaizen/ui';
import { RenderizadorSecciones } from '@kaizen/ui/bloques';
import { plantilla } from '@/lib/plantilla';

/** Página pública: lee solo lo publicado (o el borrador si es la vista previa con sesión). */
export default async function Inicio({ searchParams }: { searchParams: Promise<{ vista?: string }> }) {
  const { vista } = await searchParams;
  const { secciones, estado } = await plantilla.obtenerContenido({ vista });
  return (
    <>
      <AvisoDemo />
      {estado === 'borrador' && (
        <p className="bg-secundario py-1 text-center text-xs text-secundario-texto">Vista previa del borrador</p>
      )}
      <main id="contenido" tabIndex={-1}>
        <RenderizadorSecciones secciones={secciones} contexto={{ origen: 'formulario-web' }} />
      </main>
      <TablaEstados funciones={plantilla.config.funciones ?? []} />
    </>
  );
}
