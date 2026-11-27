import { AvisoDemo, TablaEstados } from '@kaizen/ui';
import { RenderizadorSecciones } from '@kaizen/ui/bloques';
import { BLOQUES_PRESENTACION, casosDe } from '@/componentes/bloques';
import { plantilla } from '@/lib/plantilla';

export default async function Inicio({ searchParams }: { searchParams: Promise<{ vista?: string }> }) {
  const { vista } = await searchParams;
  const { secciones, estado, datos } = await plantilla.obtenerContenido({ vista });
  const casos = casosDe(datos).map((c) => ({ id: c.id, titulo: c.titulo }));
  return (
    <>
      <AvisoDemo />
      {estado === 'borrador' && <p className="bg-secundario py-1 text-center text-xs text-secundario-texto">Vista previa del borrador</p>}
      <main>
        <RenderizadorSecciones secciones={secciones} bloques={BLOQUES_PRESENTACION} contexto={{ casos }} />
      </main>
      <TablaEstados funciones={plantilla.config.funciones ?? []} />
    </>
  );
}
