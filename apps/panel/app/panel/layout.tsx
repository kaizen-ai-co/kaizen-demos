import { AvisoDemo, Insignia } from '@kaizen/ui';
import type { ReactNode } from 'react';
import { plantilla } from '@/lib/plantilla';
import { protegerPanel } from '@/lib/proteger';

export const metadata = { robots: { index: false, follow: false } };

const ENLACES = [
  { href: '/panel', texto: 'Resumen' },
  { href: '/panel/leads', texto: 'Leads' },
  { href: '/panel/tablero', texto: 'Tablero' },
  { href: '/editar', texto: 'Editar' },
  { href: '/', texto: 'Formulario' },
];

export default async function LayoutPanel({ children }: { children: ReactNode }) {
  const usuario = await protegerPanel();
  const { datos } = await plantilla.obtenerContenido();
  const titulo = (datos.panel as { titulo?: string })?.titulo ?? 'Panel';
  return (
    <div className="min-h-dvh bg-superficie">
      <AvisoDemo />
      <header className="border-b border-borde bg-fondo">
        <div className="k-contenedor flex flex-wrap items-center gap-3 py-3">
          <strong className="mr-2">{titulo}</strong>
          <nav aria-label="Panel" className="flex flex-wrap gap-1 text-sm">
            {ENLACES.map((e) => (
              <a key={e.href} href={e.href} className="rounded-md px-3 py-1.5 hover:bg-superficie">
                {e.texto}
              </a>
            ))}
          </nav>
          <span className="ml-auto flex items-center gap-2 text-xs text-suave">
            {usuario.correo} <Insignia>{usuario.rol}</Insignia>
          </span>
        </div>
      </header>
      <main className="k-contenedor py-6">{children}</main>
    </div>
  );
}
