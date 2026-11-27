import { BLOQUES, type Bloque } from '@kaizen/ui/bloques';
import { lista } from '@kaizen/ui';
import type { Contenido } from '@kaizen/editor';
import { ContactoCaso } from './ContactoCaso';
import { GaleriaCasos, type Caso } from './GaleriaCasos';

/** Bloques de la plantilla 2: los comunes más la galería de casos y el contacto que conoce el caso. */
export const BLOQUES_PRESENTACION: Record<string, Bloque> = {
  ...BLOQUES,
  casos: GaleriaCasos,
  contacto: ContactoCaso,
};

export function casosDe(datos: Contenido): Caso[] {
  return lista<Caso>((datos.casos as Record<string, unknown> | undefined)?.items);
}
