import type { CapaDatos, Lead, NuevoLead } from '@kaizen/datos';
import {
  asignarResponsable,
  type EstadoAsignacion,
  type ReglaAsignacion,
  type Responsable,
} from '@kaizen/modulos/asignacion';

/**
 * Lógica del CRM de la plantilla 5, sin dependencias de Next (se prueba con Vitest).
 * Lee etapas, responsables y regla de asignación del contenido publicado.
 */

export interface Etapa {
  id: string;
  nombre: string;
  color?: string;
  cerrada?: boolean;
}

export type Contenido = Record<string, unknown>;

export function etapasDe(contenido: Contenido): Etapa[] {
  const l = (contenido.etapas as { lista?: Etapa[] } | undefined)?.lista;
  return Array.isArray(l) && l.length ? l : [{ id: 'nuevo', nombre: 'Nuevo' }];
}

export function responsablesDe(contenido: Contenido): Responsable[] {
  const l = (contenido.responsables as { lista?: Responsable[] } | undefined)?.lista;
  return Array.isArray(l) ? l.map((r) => ({ ...r, activo: r.activo !== false })) : [];
}

export function reglaDe(contenido: Contenido): ReglaAsignacion {
  const r = (contenido.asignacion ?? {}) as Partial<ReglaAsignacion>;
  return { modo: r.modo ?? 'turnos', porOrigen: Array.isArray(r.porOrigen) ? r.porOrigen : [] };
}

export const CLAVE_ESTADO = { coleccion: 'sistema', id: 'asignacion' } as const;

/**
 * Gancho `antesDeCrearLead`: pone la etapa de entrada y asigna responsable según la regla.
 * El puntero de turnos queda guardado en la capa de datos (sistema/asignacion).
 */
export async function asignarAlCrear(lead: NuevoLead, capa: CapaDatos, contenido: Contenido): Promise<NuevoLead> {
  const etapas = etapasDe(contenido);
  const regla = reglaDe(contenido);
  const estado = ((await capa.colecciones.leer(lead.sitioId, CLAVE_ESTADO.coleccion, CLAVE_ESTADO.id)) ??
    {}) as EstadoAsignacion;

  if (regla.modo === 'carga') {
    const cerradas = new Set(etapas.filter((e) => e.cerrada).map((e) => e.id));
    const abiertos: Record<string, number> = {};
    for (const l of await capa.leads.listar(lead.sitioId)) {
      if (l.responsableId && !cerradas.has(l.etapa)) abiertos[l.responsableId] = (abiertos[l.responsableId] ?? 0) + 1;
    }
    estado.abiertos = abiertos;
  }

  const decision = asignarResponsable(lead, responsablesDe(contenido), regla, estado);
  await capa.colecciones.guardar(lead.sitioId, CLAVE_ESTADO.coleccion, CLAVE_ESTADO.id, {
    ultimoId: decision.siguienteEstado.ultimoId ?? null,
  });
  return {
    ...lead,
    etapa: lead.etapa ?? etapas[0]!.id,
    responsableId: lead.responsableId ?? decision.responsableId,
  };
}

export interface Metricas {
  total: number;
  porEtapa: { id: string; nombre: string; color?: string; cantidad: number }[];
  porResponsable: { id: string; nombre: string; cantidad: number }[];
  sinAsignar: number;
}

export function calcularMetricas(leads: Lead[], contenido: Contenido): Metricas {
  const etapas = etapasDe(contenido);
  const responsables = responsablesDe(contenido);
  const porEtapa = etapas.map((e) => ({
    id: e.id,
    nombre: e.nombre,
    color: e.color,
    cantidad: leads.filter((l) => l.etapa === e.id).length,
  }));
  const otras = leads.filter((l) => !etapas.some((e) => e.id === l.etapa)).length;
  if (otras) porEtapa.push({ id: '_otra', nombre: 'Otra etapa', color: 'neutro', cantidad: otras });
  return {
    total: leads.length,
    porEtapa,
    porResponsable: responsables.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      cantidad: leads.filter((l) => l.responsableId === r.id).length,
    })),
    sinAsignar: leads.filter((l) => !l.responsableId).length,
  };
}

export const nombreResponsable = (contenido: Contenido, id?: string) =>
  (id && responsablesDe(contenido).find((r) => r.id === id)?.nombre) || (id ? id : 'Sin asignar');

export const nombreEtapa = (contenido: Contenido, id: string) =>
  etapasDe(contenido).find((e) => e.id === id)?.nombre ?? id;

/** Clases de tono por token del tema (nunca colores sueltos). */
export const TONOS: Record<string, string> = {
  primario: 'bg-primario',
  acento: 'bg-acento',
  exito: 'bg-exito',
  aviso: 'bg-aviso',
  peligro: 'bg-peligro',
  neutro: 'bg-suave',
};
