import { resolverTema, type SobrescriturasTema } from '@kaizen/tema';
import type { Metadata, MetadataRoute } from 'next';
import { ImageResponse } from 'next/og';

/**
 * Metadatos comunes de las demos: título, descripción, noindex, Open Graph (para que el enlace se vea
 * bien al compartirlo por WhatsApp o correo) e ícono hecho con el color primario y la inicial de la marca.
 * Todo sale del contenido y del tema del sitio. Sin SDKs de proveedores: `next/og` es parte de Next.
 */
export interface DatosMetadatos {
  marca: string;
  titulo?: string;
  descripcion?: string;
  tema?: SobrescriturasTema | null;
}

/** URL pública del sitio (opcional) para que og:image sea absoluta. Ej.: SITIO_URL=https://demos.ejemplo.co */
function urlBase(): URL | undefined {
  const url = process.env.SITIO_URL;
  try {
    return url ? new URL(url) : undefined;
  } catch {
    return undefined;
  }
}

const escaparXml = (s: string) =>
  s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!);

/** Favicon SVG: inicial de la marca sobre el color primario del tema del sitio. */
export function iconoDemo(marca: string, tema?: SobrescriturasTema | null): string {
  const { colores } = resolverTema(tema);
  const inicial = escaparXml((marca.trim()[0] ?? 'K').toUpperCase());
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="${colores.primario}"/><text x="16" y="22" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="${colores.primarioTexto}" text-anchor="middle">${inicial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function metadatosDemo({ marca, titulo, descripcion, tema }: DatosMetadatos): Metadata {
  const tituloCompleto = (titulo ? `${marca} · ${titulo}` : marca).slice(0, 70);
  const desc = descripcion?.slice(0, 160);
  return {
    metadataBase: urlBase(),
    title: tituloCompleto,
    description: desc,
    robots: { index: false, follow: false }, // las demos usan datos ficticios: no se indexan
    openGraph: { type: 'website', locale: 'es_CO', siteName: marca, title: tituloCompleto, description: desc },
    twitter: { card: 'summary_large_image', title: tituloCompleto, description: desc },
    icons: { icon: iconoDemo(marca, tema) },
  };
}

export const TAMANO_OG = { width: 1200, height: 630 };

/** Imagen para compartir (1200×630) con la marca, el título y los colores del sitio. */
export function imagenOgDemo({ marca, titulo, descripcion, tema }: DatosMetadatos): ImageResponse {
  const { colores } = resolverTema(tema);
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        background: colores.primario,
        color: colores.primarioTexto,
      }}
    >
      <div style={{ fontSize: 40, fontWeight: 700, opacity: 0.9 }}>{marca}</div>
      {titulo && <div style={{ fontSize: 72, fontWeight: 700, marginTop: 24, lineHeight: 1.1 }}>{titulo}</div>}
      {descripcion && (
        <div style={{ fontSize: 32, marginTop: 28, opacity: 0.9, maxWidth: 1000 }}>{descripcion.slice(0, 140)}</div>
      )}
    </div>,
    TAMANO_OG,
  );
}

/**
 * robots.txt de las demos: los rastreadores pueden leer las páginas (así funcionan las vistas previas al
 * compartir), que ya llevan noindex; el editor y la API quedan fuera.
 */
export function robotsDemo(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/', disallow: ['/editar', '/api/'] } };
}
