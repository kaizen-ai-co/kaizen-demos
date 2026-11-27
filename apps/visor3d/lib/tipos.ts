/**
 * Tipos y utilidades puras del visor 3D (cliente y servidor).
 */
export type V3 = [number, number, number];

export interface OpcionParte {
  id: string;
  nombre: string;
  color: string;
  rugosidad?: number;
  metalicidad?: number;
}

export interface Parte {
  id: string;
  nombre: string;
  /** Nombre de la malla o del material del modelo que cambia esta parte. */
  malla: string;
  opciones: OpcionParte[];
}

export interface VistaCamara {
  posicion: V3;
  objetivo: V3;
  fov: number;
}

export interface Escena {
  iluminacion: number;
  entorno: string;
  fondo?: string;
}

/** Parte → id de la opción elegida. */
export type Seleccion = Record<string, string>;

export const VISTA_POR_DEFECTO: VistaCamara = { posicion: [2.2, 1.5, 2.4], objetivo: [0, 0.55, 0], fov: 40 };

const esV3 = (v: unknown): v is V3 => Array.isArray(v) && v.length === 3 && v.every((n) => typeof n === 'number' && Number.isFinite(n));

export function normalizarVista(v: unknown): VistaCamara {
  const x = (v ?? {}) as Partial<VistaCamara>;
  return {
    posicion: esV3(x.posicion) ? x.posicion : VISTA_POR_DEFECTO.posicion,
    objetivo: esV3(x.objetivo) ? x.objetivo : VISTA_POR_DEFECTO.objetivo,
    fov: typeof x.fov === 'number' && x.fov >= 10 && x.fov <= 100 ? x.fov : VISTA_POR_DEFECTO.fov,
  };
}

export function normalizarEscena(v: unknown): Escena {
  const x = (v ?? {}) as Partial<Escena>;
  return {
    iluminacion: typeof x.iluminacion === 'number' ? x.iluminacion : 1.2,
    entorno: typeof x.entorno === 'string' && x.entorno ? x.entorno : 'local',
    fondo: typeof x.fondo === 'string' && x.fondo ? x.fondo : undefined,
  };
}

export function normalizarPartes(v: unknown): Parte[] {
  return (Array.isArray(v) ? v : [])
    .filter((p): p is Parte => !!p && typeof p === 'object' && Array.isArray((p as Parte).opciones))
    .map((p, i) => ({
      ...p,
      id: p.id || `parte-${i + 1}`,
      opciones: p.opciones.map((o, j) => ({ ...o, id: o.id || `opcion-${j + 1}` })),
    }));
}

export function seleccionInicial(partes: Parte[]): Seleccion {
  return Object.fromEntries(partes.filter((p) => p.opciones[0]).map((p) => [p.id, p.opciones[0]!.id]));
}

export function opcionElegida(parte: Parte, sel: Seleccion): OpcionParte | undefined {
  return parte.opciones.find((o) => o.id === sel[parte.id]) ?? parte.opciones[0];
}

/** malla/material → opción elegida (lo que el visor aplica). */
export function materialesPorMalla(partes: Parte[], sel: Seleccion): Record<string, OpcionParte> {
  const salida: Record<string, OpcionParte> = {};
  for (const p of partes) {
    const o = opcionElegida(p, sel);
    if (o && p.malla) salida[p.malla] = o;
  }
  return salida;
}

/** "Asiento: Arcilla · Patas: Acero" (se guarda en el lead para leerlo sin abrir el visor). */
export function resumenSeleccion(partes: Parte[], sel: Seleccion): string {
  return partes.map((p) => `${p.nombre}: ${opcionElegida(p, sel)?.nombre ?? '—'}`).join(' · ');
}
