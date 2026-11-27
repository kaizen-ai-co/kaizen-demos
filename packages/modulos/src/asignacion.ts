/**
 * Regla de asignación de leads al crearlos (plantilla 5). Configurable por el
 * Desarrollador desde /editar:
 *  - "turnos": reparte en orden entre los responsables activos (round robin).
 *  - "origen": asigna según el origen del lead; si no hay regla, cae en turnos.
 *  - "carga": al responsable activo con menos leads abiertos.
 *  - "manual": no asigna; queda sin responsable.
 *
 * Es pura: recibe el estado (último asignado, conteos) y devuelve la decisión.
 * La ruta del servidor guarda el nuevo puntero de turnos en la capa de datos.
 */

export type ModoAsignacion = 'turnos' | 'origen' | 'carga' | 'manual';

export interface Responsable {
  id: string;
  nombre: string;
  activo: boolean;
}

export interface ReglaAsignacion {
  modo: ModoAsignacion;
  /** origen → id de responsable (modo "origen"). */
  porOrigen?: { origen: string; responsableId: string }[];
}

export interface EstadoAsignacion {
  /** Id del último responsable asignado por turnos. */
  ultimoId?: string;
  /** Leads abiertos por responsable (modo "carga"). */
  abiertos?: Record<string, number>;
}

export interface Decision {
  responsableId?: string;
  motivo: string;
  siguienteEstado: EstadoAsignacion;
}

function porTurnos(activos: Responsable[], estado: EstadoAsignacion): Decision {
  if (!activos.length) return { motivo: 'sin responsables activos', siguienteEstado: estado };
  const i = activos.findIndex((r) => r.id === estado.ultimoId);
  const elegido = activos[(i + 1) % activos.length]!;
  return { responsableId: elegido.id, motivo: 'turnos', siguienteEstado: { ...estado, ultimoId: elegido.id } };
}

export function asignarResponsable(
  lead: { origen: string },
  responsables: Responsable[],
  regla: ReglaAsignacion,
  estado: EstadoAsignacion = {},
): Decision {
  const activos = responsables.filter((r) => r.activo);
  switch (regla.modo) {
    case 'manual':
      return { motivo: 'manual', siguienteEstado: estado };
    case 'origen': {
      const r = regla.porOrigen?.find((x) => x.origen === lead.origen);
      if (r && activos.some((a) => a.id === r.responsableId)) {
        return { responsableId: r.responsableId, motivo: `origen:${lead.origen}`, siguienteEstado: estado };
      }
      return { ...porTurnos(activos, estado), motivo: 'origen sin regla → turnos' };
    }
    case 'carga': {
      if (!activos.length) return { motivo: 'sin responsables activos', siguienteEstado: estado };
      const conteo = estado.abiertos ?? {};
      const elegido = [...activos].sort((a, b) => (conteo[a.id] ?? 0) - (conteo[b.id] ?? 0))[0]!;
      return {
        responsableId: elegido.id,
        motivo: 'menor carga',
        siguienteEstado: { ...estado, abiertos: { ...conteo, [elegido.id]: (conteo[elegido.id] ?? 0) + 1 } },
      };
    }
    case 'turnos':
    default:
      return porTurnos(activos, estado);
  }
}
