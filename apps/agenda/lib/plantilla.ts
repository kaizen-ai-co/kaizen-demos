import 'server-only';
import type { EstadoCita } from '@kaizen/datos';
import type { EsquemaContenido } from '@kaizen/editor';
import { fechaBogota, instanteBogota, isoBogota, sumarDias } from '@kaizen/modulos/huecos';
import { definirPlantilla } from '@kaizen/nucleo/servidor';
import { resolverSemilla } from '@kaizen/semillas';
import citasDemo from '@kaizen/semillas/agenda/citas.json';
import esquema from '../contenido.schema.json';
import { serviciosDe } from './agenda';

const semilla = resolverSemilla('agenda');

/**
 * Plantilla 6 · Agendamiento de citas.
 * Recorrido: reserva en 4 pasos (/) → la capa de datos verifica y guarda la cita en una sola
 * operación → calendario semanal del equipo (/calendario) → el hueco ya no se ofrece.
 */
export const plantilla = definirPlantilla({
  plantilla: 'agenda',
  sitioPorDefecto: 'demo-agenda',
  esquema: esquema as EsquemaContenido,
  semilla,
  /** Citas ficticias relativas a hoy (así la demo nunca arranca con la agenda vacía o en el pasado). */
  async sembrarDatos(capa, sitioId) {
    const hoy = fechaBogota(Date.now());
    const servicios = serviciosDe(semilla);
    for (const c of citasDemo as {
      servicioId: string;
      profesionalId: string;
      diasDesdeHoy: number;
      hora: string;
      estado: EstadoCita;
      visitante: { nombre: string; telefono?: string; correo?: string };
    }[]) {
      const duracion = servicios.find((s) => s.id === c.servicioId)?.duracionMin ?? 30;
      const [h, m] = c.hora.split(':').map(Number);
      const inicioMs = instanteBogota(sumarDias(hoy, c.diasDesdeHoy), h! * 60 + m!);
      const r = await capa.citas.reservar({
        sitioId,
        servicioId: c.servicioId,
        profesionalId: c.profesionalId,
        inicio: isoBogota(inicioMs),
        fin: isoBogota(inicioMs + duracion * 60_000),
        visitante: c.visitante,
      });
      if (r.ok && c.estado !== 'pendiente') await capa.citas.cambiarEstado(sitioId, r.cita.id, c.estado);
    }
  },
  funciones: [
    { nombre: 'Reserva en 4 pasos', estado: 'disponible' },
    { nombre: 'Huecos según horario, excepciones y citas (America/Bogota)', estado: 'disponible' },
    { nombre: 'Bloqueo de doble reserva', estado: 'disponible' },
    { nombre: 'Calendario semanal con estados', estado: 'disponible' },
    { nombre: 'Confirmación en pantalla', estado: 'disponible' },
    { nombre: 'Recordatorios por correo o WhatsApp', estado: 'pendiente' },
    { nombre: 'Pago anticipado de la cita', estado: 'pendiente' },
  ],
});
