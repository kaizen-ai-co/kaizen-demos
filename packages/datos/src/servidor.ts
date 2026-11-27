import type { CapaDatos } from './interfaces';
import { crearCapaMemoria } from './memoria';

/**
 * Fábrica única de la capa de datos (solo servidor).
 *
 *   DATOS_PROVEEDOR=memoria   → desarrollo local y pruebas
 *   DATOS_PROVEEDOR=firebase  → pruebas en Vercel
 *
 * Producción en AWS NO está escrita (decisión de Santiago 25/11): cuando se
 * apruebe, se agrega aquí `aws: () => crearCapaAws()` y nada más cambia.
 *
 * También se puede sustituir una sola pieza (p. ej. leads hacia Jericó) con
 * `registrarSustituto('leads', miRepo)` desde instrumentation.ts de la app.
 */
type Fabrica = () => CapaDatos | Promise<CapaDatos>;

const FABRICAS: Record<string, Fabrica> = {
  memoria: crearCapaMemoria,
  firebase: async () => (await import('./firebase')).crearCapaFirebase(),
};

const sustitutos: Partial<CapaDatos> = {};
let cache: Promise<CapaDatos> | null = null;

export function registrarProveedor(nombre: string, fabrica: Fabrica) {
  FABRICAS[nombre] = fabrica;
  cache = null;
}

export function registrarSustituto<K extends Exclude<keyof CapaDatos, 'proveedor'>>(pieza: K, impl: CapaDatos[K]) {
  (sustitutos as Record<string, unknown>)[pieza] = impl;
  cache = null;
}

export function obtenerCapaDatos(): Promise<CapaDatos> {
  if (!cache) {
    const nombre = process.env.DATOS_PROVEEDOR ?? 'memoria';
    const fabrica = FABRICAS[nombre];
    if (!fabrica) throw new Error(`DATOS_PROVEEDOR desconocido: "${nombre}". Opciones: ${Object.keys(FABRICAS).join(', ')}`);
    cache = Promise.resolve(fabrica()).then((capa) => ({ ...capa, ...sustitutos }));
  }
  return cache;
}

export { leerArchivoMemoria, reiniciarMemoria, usuariosDePrueba, PREFIJO_CREDENCIAL_MEMORIA } from './memoria';
