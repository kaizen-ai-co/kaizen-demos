import { temaACss, type SobrescriturasTema } from '@kaizen/tema';
import type { ReactNode } from 'react';

/**
 * <html> común: idioma, tema (con las sobrescrituras de color del sitio) y metadatos.
 * Las páginas públicas y /editar comparten este layout.
 */
export function LayoutDemo({ children, tema }: { children: ReactNode; tema?: SobrescriturasTema | null }) {
  return (
    <html lang="es-CO" suppressHydrationWarning>
      <head>
        <style id="kaizen-tema" dangerouslySetInnerHTML={{ __html: temaACss(tema) }} />
      </head>
      <body className="min-h-dvh antialiased">
        {/* Enlace para saltar al contenido (WCAG 2.4.1). Cada página marca su contenido con id="contenido". */}
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primario focus:px-4 focus:py-2 focus:text-primario-texto"
        >
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
