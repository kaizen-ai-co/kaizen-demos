import { beforeEach, describe, expect, it } from 'vitest';
import { evaluarAcceso, tienePermiso } from './acceso';
import type { CapaDatos } from './interfaces';
import { crearCapaMemoria, reiniciarMemoria } from './memoria';

/**
 * Suite de contrato: todo proveedor de la capa de datos debe pasarla.
 * Para probar otro proveedor, agrégalo a PROVEEDORES con su fábrica.
 */
const PROVEEDORES: Record<string, () => CapaDatos> = {
  memoria: () => {
    reiniciarMemoria();
    return crearCapaMemoria();
  },
};

for (const [nombre, fabrica] of Object.entries(PROVEEDORES)) {
  describe(`contrato de la capa de datos · ${nombre}`, () => {
    let capa: CapaDatos;
    beforeEach(() => {
      capa = fabrica();
    });

    it('identidad: las tres cuentas de prueba se comportan como dice el documento', async () => {
      const dev = await capa.identidad.verificarSesion('memoria:desarrollador@kaizen.test');
      const admin = await capa.identidad.verificarSesion('memoria:administrador@kaizen.test');
      const extrano = await capa.identidad.verificarSesion('memoria:nadie@kaizen.test');
      expect(evaluarAcceso(dev, 'demo').ok).toBe(true);
      expect(evaluarAcceso(admin, 'demo').ok).toBe(true);
      expect(evaluarAcceso(extrano, 'demo')).toMatchObject({ ok: false, motivo: 'no-registrado' });
      expect(tienePermiso(admin, 'estructura:editar')).toBe(false);
      expect(tienePermiso(dev, 'estructura:editar')).toBe(true);
      expect(tienePermiso(extrano, 'contenido:leer-borrador')).toBe(false);
    });

    it('contenido: borrador → publicar → volver atrás', async () => {
      await capa.contenido.guardarBorrador('s1', { titulo: 'v1' }, 'a');
      expect(await capa.contenido.leerPublicado('s1')).toBeNull(); // un borrador nunca es público
      await capa.contenido.publicar('s1', 'a');
      await capa.contenido.guardarBorrador('s1', { titulo: 'v2' }, 'a');
      await capa.contenido.publicar('s1', 'b');
      expect((await capa.contenido.leerPublicado('s1'))?.datos).toEqual({ titulo: 'v2' });
      expect((await capa.contenido.leerPublicado('s1'))?.publicadoPor).toBe('b');
      await capa.contenido.volverAtras('s1', 'c');
      expect((await capa.contenido.leerPublicado('s1'))?.datos).toEqual({ titulo: 'v1' });
      expect((await capa.contenido.leerBorrador('s1'))?.datos).toEqual({ titulo: 'v1' });
    });

    it('leads: crear, filtrar y registrar historial de etapa y responsable', async () => {
      const l = await capa.leads.crear({
        sitioId: 's1',
        nombre: 'Ana Ficticia',
        contacto: { correo: 'ana@ejemplo.test' },
        origen: 'formulario-movil',
        responsableId: 'r1',
      });
      expect(l.etapa).toBe('nuevo');
      const act = await capa.leads.actualizar(
        's1',
        l.id,
        { etapa: 'contactado', responsableId: 'r2', nota: 'Llamar el lunes' },
        'admin',
      );
      expect(act.historial.map((h) => h.tipo)).toEqual(['creado', 'responsable', 'etapa', 'responsable', 'nota']);
      expect(await capa.leads.listar('s1', { etapa: 'contactado' })).toHaveLength(1);
      expect(await capa.leads.listar('s1', { texto: 'ana' })).toHaveLength(1);
      expect(await capa.leads.listar('otro')).toHaveLength(0);
    });

    it('citas: no permite doble reserva del mismo hueco', async () => {
      const base = {
        sitioId: 's1',
        servicioId: 'sv',
        profesionalId: 'p1',
        visitante: { nombre: 'Visitante Ficticio' },
      };
      const a = await capa.citas.reservar({
        ...base,
        inicio: '2026-12-01T09:00:00-05:00',
        fin: '2026-12-01T09:30:00-05:00',
      });
      const b = await capa.citas.reservar({
        ...base,
        inicio: '2026-12-01T09:15:00-05:00',
        fin: '2026-12-01T09:45:00-05:00',
      });
      const c = await capa.citas.reservar({
        ...base,
        profesionalId: 'p2',
        inicio: '2026-12-01T09:15:00-05:00',
        fin: '2026-12-01T09:45:00-05:00',
      });
      expect(a.ok).toBe(true);
      expect(b).toEqual({ ok: false, motivo: 'ocupado' });
      expect(c.ok).toBe(true);
      if (a.ok) await capa.citas.cambiarEstado('s1', a.cita.id, 'cancelada');
      const d = await capa.citas.reservar({
        ...base,
        inicio: '2026-12-01T09:15:00-05:00',
        fin: '2026-12-01T09:45:00-05:00',
      });
      expect(d.ok).toBe(true); // un hueco cancelado vuelve a estar libre
    });

    it('cotizaciones: numeración consecutiva por sitio', async () => {
      const base = {
        sitioId: 's1',
        cliente: { nombre: 'Empresa Ficticia' },
        items: [],
        totales: { subtotal: 0, descuento: 0, baseImpuesto: 0, impuesto: 0, total: 0 },
        condiciones: { validezDias: 15, tasaImpuesto: 0.19, descuentoPorcentaje: 0, entrega: '5 días' },
      };
      const c1 = await capa.cotizaciones.crear(base);
      const c2 = await capa.cotizaciones.crear(base);
      expect(c1.numero.endsWith('000001')).toBe(true);
      expect(c2.numero.endsWith('000002')).toBe(true);
    });
  });
}

describe('acceso del rol Cliente', () => {
  const cliente = {
    uid: 'c',
    correo: 'c@x.test',
    rol: 'cliente' as const,
    activo: true,
    sitioId: 'mi-sitio',
    venceEl: '2026-12-10T00:00:00Z',
  };
  it('solo entra a su sitio y durante el periodo de prueba', () => {
    const hoy = new Date('2026-12-01T00:00:00Z');
    expect(evaluarAcceso(cliente, 'mi-sitio', hoy).ok).toBe(true);
    expect(evaluarAcceso(cliente, 'otro', hoy)).toMatchObject({ ok: false, motivo: 'otro-sitio' });
    expect(evaluarAcceso(cliente, 'mi-sitio', new Date('2026-12-11T00:00:00Z'))).toMatchObject({
      ok: false,
      motivo: 'vencido',
    });
  });
});
