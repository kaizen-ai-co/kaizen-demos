import { BotonEnlace, Insignia, formatearPrecio, img, texto } from '@kaizen/ui';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BotonAgregar } from '@/componentes/Interactivos';
import { Marco } from '@/componentes/Marco';
import { leerCatalogo } from '@/lib/cotizacion';
import { plantilla } from '@/lib/plantilla';

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ vista?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { datos } = await plantilla.obtenerContenido();
  const p = leerCatalogo(datos).productos.find((x) => x.id === id);
  return {
    title: p?.nombre ?? 'Producto no encontrado',
    description: p?.descripcion,
    robots: { index: false, follow: false },
  };
}

export default async function DetalleProducto({ params, searchParams }: Props) {
  const { id } = await params;
  const { vista } = await searchParams;
  const { datos, estado } = await plantilla.obtenerContenido({ vista });
  const { productos, categorias, condiciones } = leerCatalogo(datos);
  const p = productos.find((x) => x.id === id);
  if (!p) notFound();
  const foto = img(p.foto, p.nombre);
  const cat = (datos.catalogo ?? {}) as Record<string, unknown>;
  const moneda = condiciones.moneda ?? 'COP';

  return (
    <Marco datos={datos} estado={estado}>
      <div className="k-contenedor k-seccion">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-suave hover:text-texto">
          <ArrowLeft aria-hidden className="size-4" /> Volver al catálogo
        </Link>
        <div className="mt-6 grid gap-10 md:grid-cols-2">
          {foto ? (
            <img
              src={foto.src}
              alt={foto.alt}
              className="aspect-square w-full rounded-xl bg-superficie object-contain p-8"
            />
          ) : (
            <div className="aspect-square rounded-xl bg-superficie" />
          )}
          <div>
            <Insignia>{categorias.find((c) => c.id === p.categoria)?.nombre ?? p.categoria}</Insignia>
            <h1 className="mt-3 text-3xl md:text-4xl">{p.nombre}</h1>
            {p.descripcion && <p className="mt-4 whitespace-pre-line text-lg text-suave">{p.descripcion}</p>}
            <p className="mt-6 text-3xl font-bold">
              {formatearPrecio(p.precio, moneda)} <span className="text-base font-normal text-suave">/ {p.unidad}</span>
            </p>
            <p className="mt-1 text-sm text-suave">
              Antes de {condiciones.nombreImpuesto ?? 'impuestos'}. Precio de demostración.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <BotonAgregar
                productoId={p.id}
                texto={texto(cat.textoAgregar, 'Agregar a la cotización')}
                deshabilitado={p.disponible === false}
                textoDeshabilitado={texto(cat.textoAgotado, 'No disponible')}
              />
              <BotonEnlace href="/cotizacion" variante="borde">
                Ver mi cotización
              </BotonEnlace>
            </div>
            {condiciones.entrega && <p className="mt-6 text-sm text-suave">{condiciones.entrega}</p>}
          </div>
        </div>
      </div>
    </Marco>
  );
}
