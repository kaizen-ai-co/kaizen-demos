import { instanteBogota } from '@kaizen/modulos/huecos';
import { beforeEach, describe, expect, it } from 'vitest';
// '@kaizen/datos/servidor' no exporta crearCapaMemoria (y su capa queda en caché); en pruebas se usa directo.
import { crearCapaMemoria, reiniciarMemoria } from '../../../packages/datos/src/memoria';
import semilla from '../../../semillas/agenda/contenido.json';
import { huecosDisponibles, lunesDe, reservarCita } from './agenda';

// Lunes 30 nov 2026, 7:00 a. m. en Bogotá; se consulta el martes 1 dic.
const ahora = new Date(instanteBogota('2026-11-30', 7 * 60));
const SITIO = 's-agenda';
const consulta = { servicioId: 's-valoracion', profesionalId: 'p-laura', fecha: '2026-12-01', ahora };
const visitante = { nombre: 'Visitante Ficticio', telefono: '+57 300 000 0099' };

describe('agenda (plantilla 6)', () => {
  beforeEach(() => reiniciarMemoria());

  it('reservar quita el hueco y una segunda reserva del mismo hueco da "ocupado"', async () => {
    const capa = crearCapaMemoria();
    const antes = await huecosDisponibles(capa, SITIO, semilla, consulta);
    const elegido = antes.find((h) => h.inicio === '2026-12-01T09:00:00-05:00');
    expect(elegido).toBeDefined();

    const r1 = await reservarCita(capa, SITIO, semilla, { servicioId: 's-valoracion', profesionalId: 'p-laura', inicio: elegido!.inicio, visitante }, ahora);
    expect(r1.ok).toBe(true);

    const despues = await huecosDisponibles(capa, SITIO, semilla, consulta);
    expect(despues.map((h) => h.inicio)).not.toContain(elegido!.inicio);
    expect(despues.length).toBe(antes.length - 1);

    const r2 = await reservarCita(capa, SITIO, semilla, { servicioId: 's-valoracion', profesionalId: 'p-laura', inicio: elegido!.inicio, visitante }, ahora);
    expect(r2).toMatchObject({ ok: false, motivo: 'ocupado' });
    if (!r2.ok) expect(r2.alternativas.length).toBeGreaterThan(0);
  });

  it('la capa de datos rechaza la doble reserva directa (operación atómica)', async () => {
    const capa = crearCapaMemoria();
    const cita = { sitioId: SITIO, servicioId: 's-valoracion', profesionalId: 'p-laura', inicio: '2026-12-01T09:00:00-05:00', fin: '2026-12-01T09:30:00-05:00', visitante };
    expect((await capa.citas.reservar(cita)).ok).toBe(true);
    expect(await capa.citas.reservar(cita)).toEqual({ ok: false, motivo: 'ocupado' });
  });

  it('rechaza horas fuera del horario y festivos', async () => {
    const capa = crearCapaMemoria();
    const fuera = await reservarCita(capa, SITIO, semilla, { servicioId: 's-valoracion', profesionalId: 'p-laura', inicio: '2026-12-01T12:30:00-05:00', visitante }, ahora);
    expect(fuera).toMatchObject({ ok: false, motivo: 'no-disponible' });
    expect(await huecosDisponibles(capa, SITIO, semilla, { ...consulta, fecha: '2026-12-08' })).toEqual([]);
  });

  it('"cualquiera" junta huecos de los profesionales que atienden el servicio', async () => {
    const capa = crearCapaMemoria();
    const h = await huecosDisponibles(capa, SITIO, semilla, { ...consulta, profesionalId: 'cualquiera' });
    expect(new Set(h.map((x) => x.profesionalId))).toEqual(new Set(['p-laura', 'p-mateo']));
    // Mateo no atiende la sesión completa
    const s = await huecosDisponibles(capa, SITIO, semilla, { ...consulta, servicioId: 's-sesion', profesionalId: 'cualquiera' });
    expect(new Set(s.map((x) => x.profesionalId))).toEqual(new Set(['p-laura']));
  });

  it('calcula el lunes de la semana', () => {
    expect(lunesDe('2026-12-03')).toBe('2026-11-30');
    expect(lunesDe('2026-12-06')).toBe('2026-11-30');
    expect(lunesDe('2026-11-30')).toBe('2026-11-30');
  });
});
