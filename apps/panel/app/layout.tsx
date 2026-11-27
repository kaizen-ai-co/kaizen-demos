import { metadatosDemo } from '@kaizen/nucleo/metadatos';
import { LayoutDemo } from '@kaizen/nucleo/react';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { datosMetadatos } from '@/lib/metadatos';
import { plantilla } from '@/lib/plantilla';
import './globals.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { datos } = await plantilla.obtenerContenido();
  return metadatosDemo(datosMetadatos(datos));
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default async function Layout({ children }: { children: ReactNode }) {
  const { datos } = await plantilla.obtenerContenido();
  return <LayoutDemo tema={datos._estructura?.tema}>{children}</LayoutDemo>;
}
