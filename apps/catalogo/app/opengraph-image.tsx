import { TAMANO_OG, imagenOgDemo } from '@kaizen/nucleo/metadatos';
import { datosMetadatos } from '@/lib/metadatos';
import { plantilla } from '@/lib/plantilla';

export const size = TAMANO_OG;
export const contentType = 'image/png';
export const alt = 'Vista previa del sitio de demostración';

/** Imagen para compartir el enlace: marca, título y colores del sitio publicado. */
export default async function ImagenOg() {
  const { datos } = await plantilla.obtenerContenido();
  return imagenOgDemo(datosMetadatos(datos));
}
