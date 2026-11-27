import { AvisoDemo, img, texto } from '@kaizen/ui';
import { Pie } from '@kaizen/ui/bloques';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { EnlaceCotizacion } from './Interactivos';

/** Encabezado + pie comunes a las páginas del catálogo, con textos del contenido. */
export function Marco({
  datos,
  estado,
  children,
}: {
  datos: Record<string, unknown>;
  estado?: string;
  children: ReactNode;
}) {
  const enc = (datos.encabezado ?? {}) as Record<string, unknown>;
  const logo = img(enc.logo, texto(enc.marca));
  return (
    <>
      <AvisoDemo />
      {estado === 'borrador' && (
        <p className="bg-secundario py-1 text-center text-xs text-secundario-texto">Vista previa del borrador</p>
      )}
      <header className="sticky top-0 z-40 border-b border-borde bg-fondo/90 backdrop-blur">
        <div className="k-contenedor flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold">
            {logo && <img src={logo.src} alt={logo.alt} className="h-8 w-auto" />}
            <span>{texto(enc.marca, 'Catálogo')}</span>
          </Link>
          <EnlaceCotizacion texto={texto(enc.textoCotizacion, 'Mi cotización')} />
        </div>
      </header>
      <main>{children}</main>
      <Pie datos={(datos.pie ?? {}) as Record<string, unknown>} />
    </>
  );
}
