import type { DatosMetadatos } from '@kaizen/nucleo/metadatos';
import type { SobrescriturasTema } from '@kaizen/tema';

const campo = (datos: Record<string, unknown>, seccion: string, clave: string): string | undefined => {
  const v = (datos[seccion] as Record<string, unknown> | undefined)?.[clave];
  return typeof v === 'string' && v.trim() ? v : undefined;
};

/** Marca, título, descripción y tema para metadatos, Open Graph e ícono (salen del contenido). */
export function datosMetadatos(datos: Record<string, unknown>): DatosMetadatos {
  return {
    marca: campo(datos, 'encabezado', 'marca') ?? 'Catálogo',
    titulo: campo(datos, 'portada', 'titulo'),
    descripcion: campo(datos, 'portada', 'subtitulo'),
    tema: (datos._estructura as { tema?: SobrescriturasTema } | undefined)?.tema,
  };
}
