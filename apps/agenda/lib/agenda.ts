import type { CapaDatos, Cita, Contacto } from '@kaizen/datos';
import {
  calcularHuecos,
  calcularHuecosVarios,
  fechaBogota,
  instanteBogota,
  isoBogota,
  sumarDias,
  REGLAS_POR_DEFECTO,
  type Excepcion,
  type HorarioSemanal,
  type Hueco,
  type ReglasHuecos,
} from '@kaizen/modulos/huecos';

/**
 * Lógica de la agenda (plantilla 6) sin dependencias de Next: lee servicios, profesionales,
 * excepciones y reglas del contenido publicado y calcula/valida huecos con @kaizen/modulos/huecos.
 * La garantía contra doble reserva está en capa.citas.reservar (operación atómica).
 */

export type Contenido = Record<string, unknown>;

export interface Servicio { id: string; nombre: string; descripcion?: string; duracionMin: number; precio?: number }
export interface Profesional { id: string; nombre: string; cargo?: string; foto?: { url?: string; alt?: string } | null; servicios?: string[]; horario?: HorarioSemanal }

const listaDe = <T>(contenido: Contenido, seccion: string): T[] => {
  const l = (contenido[seccion] as { lista?: T[] } | undefined)?.lista;
  return Array.isArray(l) ? l : [];
};

export const serviciosDe = (c: Contenido) => listaDe<Servicio>(c, 'servicios');
export const profesionalesDe = (c: Contenido) => listaDe<Profesional>(c, 'profesionales');

export function excepcionesDe(c: Contenido): Excepcion[] {
  return listaDe<{ fecha: string; profesionalId?: string; motivo?: string; franjas?: { inicio: string; fin: string }[] }>(c, 'excepciones')
    .filter((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.fecha ?? ''))
    .map((e) => ({ fecha: e.fecha, motivo: e.motivo, profesionalId: e.profesionalId || undefined, franjas: e.franjas?.length ? e.franjas : undefined }));
}

export function reglasDe(c: Contenido): ReglasHuecos {
  const r = (c.reglas ?? {}) as Partial<ReglasHuecos>;
  const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
  return {
    intervaloMin: Math.max(5, num(r.intervaloMin, REGLAS_POR_DEFECTO.intervaloMin)),
    colchonMin: num(r.colchonMin, REGLAS_POR_DEFECTO.colchonMin),
    anticipacionMin: num(r.anticipacionMin, REGLAS_POR_DEFECTO.anticipacionMin),
    diasAdelante: num(r.diasAdelante, REGLAS_POR_DEFECTO.diasAdelante),
  };
}

/** Profesionales que atienden un servicio (lista vacía de servicios = atiende todos). */
export function profesionalesParaServicio(c: Contenido, servicioId: string): Profesional[] {
  return profesionalesDe(c).filter((p) => !p.servicios?.length || p.servicios.includes(servicioId));
}

export interface ConsultaHuecos {
  servicioId: string;
  /** id de profesional o "cualquiera". */
  profesionalId: string;
  fecha: string;
  ahora?: Date;
}

export class ErrorAgenda extends Error {}

/** Citas del día (y vecinas) que pueden ocupar huecos. */
async function citasDelDia(capa: CapaDatos, sitioId: string, fecha: string): Promise<Cita[]> {
  const desde = new Date(instanteBogota(fecha, 0)).toISOString();
  const hasta = new Date(instanteBogota(sumarDias(fecha, 1), 0)).toISOString();
  return capa.citas.listarRango(sitioId, desde, hasta);
}

export async function huecosDisponibles(capa: CapaDatos, sitioId: string, c: Contenido, q: ConsultaHuecos): Promise<Hueco[]> {
  const servicio = serviciosDe(c).find((s) => s.id === q.servicioId);
  if (!servicio) throw new ErrorAgenda('Servicio no encontrado.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(q.fecha)) throw new ErrorAgenda('Fecha inválida (AAAA-MM-DD).');
  const candidatos = profesionalesParaServicio(c, servicio.id).filter((p) => q.profesionalId === 'cualquiera' || p.id === q.profesionalId);
  if (!candidatos.length) throw new ErrorAgenda('Ese profesional no atiende el servicio.');
  const citas = await citasDelDia(capa, sitioId, q.fecha);
  return calcularHuecosVarios(
    { fecha: q.fecha, duracionMin: servicio.duracionMin, excepciones: excepcionesDe(c), citas, reglas: reglasDe(c), ahora: q.ahora },
    candidatos.map((p) => ({ id: p.id, horario: p.horario ?? {} })),
  );
}

export interface SolicitudReserva {
  servicioId: string;
  profesionalId: string;
  inicio: string;
  visitante: { nombre: string } & Contacto;
}

export type ResultadoReservaAgenda =
  | { ok: true; cita: Cita }
  | { ok: false; motivo: 'ocupado' | 'no-disponible'; alternativas: Hueco[] };

/**
 * Reserva validando EN SERVIDOR que el hueco pedido esté entre los huecos válidos
 * (horario, excepciones, anticipación, ventana de días) y luego guarda con la operación
 * atómica de la capa de datos. Si otro visitante lo tomó, devuelve 'ocupado' con alternativas.
 */
export async function reservarCita(capa: CapaDatos, sitioId: string, c: Contenido, s: SolicitudReserva, ahora?: Date): Promise<ResultadoReservaAgenda> {
  const ms = Date.parse(s.inicio);
  if (Number.isNaN(ms)) throw new ErrorAgenda('Hora inválida.');
  const fecha = fechaBogota(ms);
  const servicio = serviciosDe(c).find((x) => x.id === s.servicioId);
  if (!servicio) throw new ErrorAgenda('Servicio no encontrado.');
  const profesional = profesionalesParaServicio(c, servicio.id).find((p) => p.id === s.profesionalId);
  if (!profesional) throw new ErrorAgenda('Ese profesional no atiende el servicio.');

  const consulta = { servicioId: s.servicioId, profesionalId: s.profesionalId, fecha, ahora };
  const validos = await huecosDisponibles(capa, sitioId, c, consulta);
  const hueco = validos.find((h) => Date.parse(h.inicio) === ms);
  if (!hueco) {
    // ¿Existía en el horario pero ya lo ocupó una cita? → 'ocupado'; si no, nunca fue válido.
    const sinCitas = calcularHuecos({
      fecha, profesionalId: profesional.id, duracionMin: servicio.duracionMin, horario: profesional.horario ?? {},
      excepciones: excepcionesDe(c), citas: [], reglas: reglasDe(c), ahora,
    });
    const motivo = sinCitas.some((h) => Date.parse(h.inicio) === ms) ? 'ocupado' : 'no-disponible';
    return { ok: false, motivo, alternativas: validos.slice(0, 6) };
  }

  const r = await capa.citas.reservar({
    sitioId,
    servicioId: servicio.id,
    profesionalId: profesional.id,
    inicio: hueco.inicio,
    fin: hueco.fin,
    visitante: s.visitante,
  });
  if (!r.ok) {
    const alternativas = await huecosDisponibles(capa, sitioId, c, consulta);
    return { ok: false, motivo: 'ocupado', alternativas: alternativas.slice(0, 6) };
  }
  return r;
}

/** Lunes (Bogotá) de la semana que contiene `fecha`. */
export function lunesDe(fecha: string): string {
  const [a, m, d] = fecha.split('-').map(Number);
  const dia = new Date(Date.UTC(a!, m! - 1, d!)).getUTCDay(); // 0 = domingo
  return sumarDias(fecha, dia === 0 ? -6 : 1 - dia);
}

export { fechaBogota, instanteBogota, isoBogota, sumarDias };
