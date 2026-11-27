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
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
