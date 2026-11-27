import path from 'node:path';
import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';

// Un solo .env.local en la raíz del monorepo sirve para las seis apps
// (Next por sí solo lo buscaría dentro de apps/<plantilla>). Las variables
// del sistema o de Vercel siguen teniendo prioridad.
// `forceReload` porque Next ya cargó (y guardó en caché) los .env de la carpeta de la app.
loadEnvConfig(path.resolve(process.cwd(), '../..'), process.env.NODE_ENV !== 'production', undefined, true);

/**
 * Configuración Next compartida por las seis apps.
 * - output "standalone": la misma imagen Docker corre en Vercel, Cloudflare o AWS.
 * - Ninguna función exclusiva de Vercel (Edge Config, Blob, KV, analítica propia).
 * - Encabezados de seguridad básicos para todas las rutas.
 */
export function configNext(extra: NextConfig = {}): NextConfig {
  // Las apps corren desde apps/<plantilla>: la raíz del monorepo está dos niveles arriba.
  const raiz = path.resolve(process.cwd(), '../..');
  return {
    output: 'standalone',
    outputFileTracingRoot: raiz,
    reactStrictMode: true,
    poweredByHeader: false,
    // El lint corre una sola vez para todo el monorepo (eslint.config.mjs, `npm run check` y CI),
    // no dentro de cada `next build`.
    eslint: { ignoreDuringBuilds: true },
    transpilePackages: [
      '@kaizen/datos',
      '@kaizen/editor',
      '@kaizen/modulos',
      '@kaizen/nucleo',
      '@kaizen/semillas',
      '@kaizen/tema',
      '@kaizen/ui',
    ],
    serverExternalPackages: ['firebase-admin'],
    turbopack: { root: raiz },
    images: { unoptimized: true },
    async headers() {
      return [
        {
          source: '/:ruta*',
          headers: [
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
            { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          ],
        },
        {
          // El editor nunca se indexa ni se incrusta en otros sitios.
          source: '/editar/:ruta*',
          headers: [
            { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
            { key: 'X-Frame-Options', value: 'DENY' },
          ],
        },
      ];
    },
    ...extra,
  };
}
