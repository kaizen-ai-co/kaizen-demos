import { LayoutDemo } from '@kaizen/nucleo/react';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { plantilla } from '@/lib/plantilla';
import './globals.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { datos } = await plantilla.obtenerContenido();
  const e = datos.encabezado as { marca?: string; titulo?: string; subtitulo?: string };
  return {
    title: `${e.marca ?? 'Demo'} · ${e.titulo ?? ''}`.slice(0, 70),
    description: e.subtitulo?.slice(0, 160),
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default async function Layout({ children }: { children: ReactNode }) {
  const { datos } = await plantilla.obtenerContenido();
  return <LayoutDemo tema={datos._estructura?.tema}>{children}</LayoutDemo>;
}
