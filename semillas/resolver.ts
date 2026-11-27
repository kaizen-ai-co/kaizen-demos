/**
 * Resuelve la semilla de una demo en tres capas (la última gana):
 *
 *   1. semillas/<plantilla>/contenido.json          → base genérica de la plantilla
 *   2. semillas/<plantilla>/sectores/<SECTOR>.json  → textos e imágenes del sector (clínica, tienda…)
 *   3. semillas/<plantilla>/demos/<SITIO_ID>.json   → la demo de un cliente, en sus palabras
 *
 * Las capas 2 y 3 son parciales: solo traen lo que cambia. Las listas se
 * reemplazan completas (no se mezclan elemento a elemento).
 *
 * `npm run nueva-demo` crea la capa 3 y la registra en `registro.ts`.
 */
import { REGISTRO } from './registro';

export type Semilla = Record<string, unknown>;

const esObjeto = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

export function mezclar(base: Semilla, ...capas: (Semilla | undefined)[]): Semilla {
  const salida: Semilla = structuredClone(base);
  for (const capa of capas) {
    if (!capa) continue;
    for (const [k, v] of Object.entries(capa)) {
      if (k.startsWith('$')) continue; // $comentario, $sector…
      salida[k] = esObjeto(v) && esObjeto(salida[k]) ? mezclar(salida[k] as Semilla, v) : structuredClone(v);
    }
  }
  return salida;
}

export function resolverSemilla(
  plantilla: string,
  opciones: { sector?: string; sitioId?: string } = { sector: process.env.SECTOR, sitioId: process.env.SITIO_ID },
): Semilla {
  const r = REGISTRO[plantilla];
  if (!r) throw new Error(`No hay semillas registradas para la plantilla "${plantilla}".`);
  const sector = opciones.sector ? r.sectores[opciones.sector] : undefined;
  if (opciones.sector && !sector)
    console.warn(`[semillas] Sector "${opciones.sector}" no existe para ${plantilla}; se usa la base.`);
  const demo = opciones.sitioId ? r.demos[opciones.sitioId] : undefined;
  return mezclar(r.base, sector, demo);
}

export function sectoresDe(plantilla: string): string[] {
  return Object.keys(REGISTRO[plantilla]?.sectores ?? {});
}
