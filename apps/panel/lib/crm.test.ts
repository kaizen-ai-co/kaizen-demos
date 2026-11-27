// '@kaizen/datos/servidor' no exporta crearCapaMemoria (y su capa queda en caché); en pruebas se usa directo.
import { crearCapaMemoria, reiniciarMemoria } from '../../../packages/datos/src/memoria';
import { beforeEach, describe, expect, it } from 'vitest';
import semilla from '../../../semillas/panel/contenido.json';
import { asignarAlCrear, calcularMetricas } from './crm';

const base = { sitioId: 's-panel', nombre: 'Lead Ficticio', contacto: { telefono: '+57 300 000 0099' }, origen: 'formulario-movil' };

describe('asignación al crear lead (plantilla 5)', () => {
  beforeEach(() => reiniciarMemoria());

  it('por turnos entre responsables activos, guardando el puntero en la capa', async () => {
    const capa = crearCapaMemoria();
    const asignados: (string | undefined)[] = [];
    for (let i = 0; i < 3; i++) {
      const l = await asignarAlCrear({ ...base }, capa, semilla);
      await capa.leads.crear(l);
      asignados.push(l.responsableId);
      expect(l.etapa).toBe('nuevo');
    }
    // r-camila está inactiva en la semilla
    expect(asignados).toEqual(['r-ana', 'r-bruno', 'r-ana']);
    expect(await capa.colecciones.leer('s-panel', 'sistema', 'asignacion')).toEqual({ ultimoId: 'r-ana' });
  });

  it('por origen, con respaldo en turnos', async () => {
    const capa = crearCapaMemoria();
    const contenido = { ...semilla, asignacion: { modo: 'origen', porOrigen: [{ origen: 'whatsapp', responsableId: 'r-bruno' }] } };
    expect((await asignarAlCrear({ ...base, origen: 'whatsapp' }, capa, contenido)).responsableId).toBe('r-bruno');
    expect((await asignarAlCrear({ ...base }, capa, contenido)).responsableId).toBe('r-ana');
  });

  it('por carga ignora leads en etapas cerradas', async () => {
    const capa = crearCapaMemoria();
    await capa.leads.crear({ ...base, responsableId: 'r-ana', etapa: 'nuevo' });
    await capa.leads.crear({ ...base, responsableId: 'r-bruno', etapa: 'ganado' });
    await capa.leads.crear({ ...base, responsableId: 'r-bruno', etapa: 'perdido' });
    const l = await asignarAlCrear({ ...base }, capa, { ...semilla, asignacion: { modo: 'carga' } });
    expect(l.responsableId).toBe('r-bruno');
  });

  it('manual no asigna', async () => {
    const l = await asignarAlCrear({ ...base }, crearCapaMemoria(), { ...semilla, asignacion: { modo: 'manual' } });
    expect(l.responsableId).toBeUndefined();
  });

  it('métricas por etapa y responsable', async () => {
    const capa = crearCapaMemoria();
    await capa.leads.crear({ ...base, responsableId: 'r-ana' });
    await capa.leads.crear({ ...base, etapa: 'ganado' });
    const m = calcularMetricas(await capa.leads.listar('s-panel'), semilla);
    expect(m.total).toBe(2);
    expect(m.porEtapa.find((e) => e.id === 'nuevo')?.cantidad).toBe(1);
    expect(m.porEtapa.find((e) => e.id === 'ganado')?.cantidad).toBe(1);
    expect(m.porResponsable.find((r) => r.id === 'r-ana')?.cantidad).toBe(1);
    expect(m.sinAsignar).toBe(1);
  });
});
