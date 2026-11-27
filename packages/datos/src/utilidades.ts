import type { Cita, CambiosLead, EventoHistorial, Lead } from './tipos';

export const ahoraISO = () => new Date().toISOString();

export function nuevoId(prefijo = ''): string {
  const aleatorio = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
  return prefijo + aleatorio.replace(/-/g, '').slice(0, 20);
}

/** Dos intervalos [a1,a2) y [b1,b2) se cruzan si a1 < b2 y b1 < a2. */
export function seCruzan(aInicio: string, aFin: string, bInicio: string, bFin: string): boolean {
  return (
    new Date(aInicio).getTime() < new Date(bFin).getTime() && new Date(bInicio).getTime() < new Date(aFin).getTime()
  );
}

export function citaChoca(nueva: Pick<Cita, 'profesionalId' | 'inicio' | 'fin'>, existentes: Cita[]): boolean {
  return existentes.some(
    (c) =>
      c.estado !== 'cancelada' &&
      c.profesionalId === nueva.profesionalId &&
      seCruzan(c.inicio, c.fin, nueva.inicio, nueva.fin),
  );
}

/**
 * Aplica cambios a un lead y deja cada cambio de etapa/responsable/nota en el historial.
 * Función pura: la usan todos los proveedores para que el historial sea idéntico.
 */
export function aplicarCambiosLead(lead: Lead, cambios: CambiosLead, autor: string, fecha = ahoraISO()): Lead {
  const historial: EventoHistorial[] = [...lead.historial];
  const siguiente: Lead = { ...lead, actualizadoEl: fecha };

  if (cambios.etapa !== undefined && cambios.etapa !== lead.etapa) {
    historial.push({ tipo: 'etapa', fecha, autor, de: lead.etapa, a: cambios.etapa });
    siguiente.etapa = cambios.etapa;
  }
  if (cambios.responsableId !== undefined && cambios.responsableId !== lead.responsableId) {
    historial.push({ tipo: 'responsable', fecha, autor, de: lead.responsableId, a: cambios.responsableId });
    siguiente.responsableId = cambios.responsableId;
  }
  if (cambios.nombre !== undefined && cambios.nombre !== lead.nombre) {
    historial.push({ tipo: 'campo', fecha, autor, detalle: 'nombre', de: lead.nombre, a: cambios.nombre });
    siguiente.nombre = cambios.nombre;
  }
  if (cambios.contacto) siguiente.contacto = { ...lead.contacto, ...cambios.contacto };
  if (cambios.campos) siguiente.campos = { ...lead.campos, ...cambios.campos };
  if (cambios.nota?.trim()) {
    const nota = { id: nuevoId('n_'), texto: cambios.nota.trim(), autor, fecha };
    siguiente.notas = [...lead.notas, nota];
    historial.push({ tipo: 'nota', fecha, autor, detalle: nota.texto.slice(0, 120) });
  }
  siguiente.historial = historial;
  return siguiente;
}

export function coincideFiltro(
  lead: Lead,
  f: { etapa?: string; responsableId?: string; origen?: string; texto?: string },
): boolean {
  if (f.etapa && lead.etapa !== f.etapa) return false;
  if (f.responsableId && lead.responsableId !== f.responsableId) return false;
  if (f.origen && lead.origen !== f.origen) return false;
  if (f.texto) {
    const t = f.texto.toLowerCase();
    const heno = [lead.nombre, lead.contacto.correo, lead.contacto.telefono, lead.origen].join(' ').toLowerCase();
    if (!heno.includes(t)) return false;
  }
  return true;
}

/** Número legible de cotización: COT-2026-000123. */
export function numeroCotizacion(secuencia: number, fecha = new Date()): string {
  return `COT-${fecha.getFullYear()}-${String(secuencia).padStart(6, '0')}`;
}
