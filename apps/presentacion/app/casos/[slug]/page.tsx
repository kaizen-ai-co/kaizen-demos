import { Aparecer, AvisoDemo, BotonEnlace, Insignia, img } from '@kaizen/ui';
import { Encabezado, Pie } from '@kaizen/ui/bloques';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { casosDe } from '@/componentes/bloques';
import { plantilla } from '@/lib/plantilla';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ vista?: string }> };

async function buscar(slug: string, vista?: string) {
  const { datos, estado } = await plantilla.obtenerContenido({ vista });
  const caso = casosDe(datos).find((c) => c.id === slug);
  return { datos, estado, caso };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { caso } = await buscar(slug);
  return {
    title: caso ? caso.titulo : 'Caso no encontrado',
    description: caso?.resumen,
    robots: { index: false, follow: false },
  };
}

/** Detalle de un caso, generado desde el contenido: no hay una página escrita a mano por caso. */
export default async function DetalleCaso({ params, searchParams }: Props) {
  const { slug } = await params;
  const { vista } = await searchParams;
  const { datos, estado, caso } = await buscar(slug, vista);
  if (!caso) notFound();
  const imagen = img(caso.imagen, caso.titulo);
  const otros = casosDe(datos)
    .filter((c) => c.id !== caso.id && c.sector === caso.sector)
    .slice(0, 2);

  return (
    <>
      <AvisoDemo />
      {estado === 'borrador' && (
        <p className="bg-secundario py-1 text-center text-xs text-secundario-texto">Vista previa del borrador</p>
      )}
      <Encabezado datos={datos.encabezado as Record<string, unknown>} />
      <main className="k-seccion">
        <article className="k-contenedor max-w-3xl">
          <a href="/#casos" className="inline-flex items-center gap-1 text-sm text-suave hover:text-texto">
            <ArrowLeft aria-hidden className="size-4" /> Todos los casos
          </a>
          <Aparecer>
            <Insignia className="mt-6">{caso.sector}</Insignia>
            <h1 className="mt-3 text-3xl md:text-5xl">{caso.titulo}</h1>
            <p className="mt-4 text-lg text-suave">{caso.resumen}</p>
          </Aparecer>
          {imagen && (
            <img
              src={imagen.src}
              alt={imagen.alt}
              className="mt-8 aspect-[16/9] w-full rounded-xl object-cover shadow-md"
            />
          )}
          <div className="mt-8 rounded-lg border border-borde bg-superficie p-5">
            <p className="text-sm text-suave">Resultado</p>
            <p className="text-2xl font-bold text-primario">{caso.resultado}</p>
          </div>
          {caso.texto && <div className="mt-8 whitespace-pre-line text-lg leading-relaxed">{caso.texto}</div>}
          <div className="mt-10 flex flex-wrap gap-3">
            <BotonEnlace tamano="lg" href={`/?caso=${encodeURIComponent(caso.id)}#contacto`}>
              Quiero algo así
            </BotonEnlace>
            <BotonEnlace tamano="lg" variante="borde" href="/#casos">
              Ver más casos
            </BotonEnlace>
          </div>
          {otros.length > 0 && (
            <aside className="mt-14">
              <h2 className="text-xl">Otros casos de {caso.sector}</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {otros.map((o) => (
                  <li key={o.id}>
                    <a href={`/casos/${o.id}`} className="block rounded-lg border border-borde p-4 hover:bg-superficie">
                      <span className="font-semibold">{o.titulo}</span>
                      <span className="mt-1 block text-sm text-primario">{o.resultado}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </article>
      </main>
      <Pie datos={datos.pie as Record<string, unknown>} />
    </>
  );
}
