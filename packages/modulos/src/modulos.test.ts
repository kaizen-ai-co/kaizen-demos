import { describe, expect, it } from 'vitest';
import { asignarResponsable, type Responsable } from './asignacion';
import { calcularHuecos, diaDeSemana, isoBogota, instanteBogota, type HorarioSemanal } from './huecos';
import { crearLimitador } from './limite';
import { calcularTotales } from './totales';

describe('totales de cotización', () => {
  it('tres productos con IVA 19 % y sin descuento', () => {
    const t = calcularTotales(
      [
        { precioUnitario: 120000, cantidad: 2 },
        { precioUnitario: 45500, cantidad: 3 },
        { precioUnitario: 9990, cantidad: 10 },
      ],
      { tasaImpuesto: 0.19 },
    );
    expect(t).toEqual({ subtotal: 476400, descuento: 0, baseImpuesto: 476400, impuesto: 90516, total: 566916 });
  });

  it('aplica descuento antes del impuesto y redondea en pesos', () => {
    const t = calcularTotales([{ precioUnitario: 33333, cantidad: 3 }], {
      tasaImpuesto: 0.19,
      descuentoPorcentaje: 0.1,
    });
    expect(t.subtotal).toBe(99999);
    expect(t.descuento).toBe(10000);
    expect(t.baseImpuesto).toBe(89999);
    expect(t.impuesto).toBe(17100);
    expect(t.total).toBe(107099);
  });

  it('admite decimales para monedas como USD', () => {
    const t = calcularTotales([{ precioUnitario: 10.5551, cantidad: 1 }], { tasaImpuesto: 0, decimales: 2 });
    expect(t.total).toBe(10.56);
  });

  it('rechaza cantidades inválidas', () => {
    expect(() => calcularTotales([{ precioUnitario: 1, cantidad: 0 }], { tasaImpuesto: 0 })).toThrow();
    expect(() => calcularTotales([{ precioUnitario: -1, cantidad: 1 }], { tasaImpuesto: 0 })).toThrow();
  });

  it('cotización vacía da cero', () => {
    expect(calcularTotales([], { tasaImpuesto: 0.19 }).total).toBe(0);
  });
});

describe('huecos de agenda (America/Bogota)', () => {
  const horario: HorarioSemanal = {
    martes: [
      { inicio: '08:00', fin: '12:00' },
      { inicio: '14:00', fin: '16:00' },
    ],
  };
  // Lunes 30 nov 2026, 7:00 a. m. en Bogotá
  const ahora = new Date(instanteBogota('2026-11-30', 7 * 60));
  const base = {
    fecha: '2026-12-01',
    profesionalId: 'p1',
    duracionMin: 60,
    horario,
    ahora,
    reglas: { intervaloMin: 30, anticipacionMin: 0 },
  };

  it('convierte horas de Bogotá sin depender del servidor', () => {
    expect(diaDeSemana('2026-12-01')).toBe('martes');
    expect(isoBogota(instanteBogota('2026-12-01', 9 * 60 + 30))).toBe('2026-12-01T09:30:00-05:00');
    expect(new Date(instanteBogota('2026-12-01', 9 * 60)).toISOString()).toBe('2026-12-01T14:00:00.000Z');
  });

  it('genera huecos por franja según duración e intervalo', () => {
    const h = calcularHuecos(base).map((x) => x.inicio.slice(11, 16));
    expect(h).toEqual(['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00']);
  });

  it('quita los huecos que chocan con citas existentes (no las canceladas)', () => {
    const h = calcularHuecos({
      ...base,
      citas: [
        { profesionalId: 'p1', inicio: '2026-12-01T09:00:00-05:00', fin: '2026-12-01T10:00:00-05:00' },
        {
          profesionalId: 'p1',
          inicio: '2026-12-01T14:00:00-05:00',
          fin: '2026-12-01T15:00:00-05:00',
          estado: 'cancelada',
        },
        { profesionalId: 'p2', inicio: '2026-12-01T11:00:00-05:00', fin: '2026-12-01T12:00:00-05:00' },
      ],
    }).map((x) => x.inicio.slice(11, 16));
    expect(h).toEqual(['08:00', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00']);
  });

  it('respeta colchón entre citas', () => {
    const h = calcularHuecos({
      ...base,
      reglas: { ...base.reglas, colchonMin: 15 },
      citas: [{ profesionalId: 'p1', inicio: '2026-12-01T10:00:00-05:00', fin: '2026-12-01T11:00:00-05:00' }],
    }).map((x) => x.inicio.slice(11, 16));
    expect(h.filter((x) => x < '12:00')).toEqual(['08:00', '08:30']);
  });

  it('bloquea festivos completos y franjas de ausencia', () => {
    expect(calcularHuecos({ ...base, excepciones: [{ fecha: '2026-12-01', motivo: 'Festivo ficticio' }] })).toEqual([]);
    const h = calcularHuecos({
      ...base,
      excepciones: [{ fecha: '2026-12-01', profesionalId: 'p1', franjas: [{ inicio: '08:00', fin: '11:00' }] }],
    });
    expect(h.map((x) => x.inicio.slice(11, 16))).toEqual(['11:00', '14:00', '14:30', '15:00']);
  });

  it('aplica anticipación mínima y ventana de días', () => {
    const casiYa = new Date(instanteBogota('2026-12-01', 9 * 60 + 10));
    const h = calcularHuecos({ ...base, ahora: casiYa, reglas: { intervaloMin: 30, anticipacionMin: 60 } }).map((x) =>
      x.inicio.slice(11, 16),
    );
    expect(h[0]).toBe('10:30');
    expect(calcularHuecos({ ...base, fecha: '2027-03-02' })).toEqual([]);
    expect(calcularHuecos({ ...base, fecha: '2026-11-24' })).toEqual([]);
  });
});

describe('asignación de leads', () => {
  const responsables: Responsable[] = [
    { id: 'a', nombre: 'Asesora Ficticia A', activo: true },
    { id: 'b', nombre: 'Asesor Ficticio B', activo: false },
    { id: 'c', nombre: 'Asesora Ficticia C', activo: true },
  ];

  it('por turnos salta inactivos y vuelve a empezar', () => {
    let estado = {};
    const elegidos: (string | undefined)[] = [];
    for (let i = 0; i < 4; i++) {
      const d = asignarResponsable({ origen: 'web' }, responsables, { modo: 'turnos' }, estado);
      elegidos.push(d.responsableId);
      estado = d.siguienteEstado;
    }
    expect(elegidos).toEqual(['a', 'c', 'a', 'c']);
  });

  it('por origen, con respaldo en turnos', () => {
    const regla = { modo: 'origen' as const, porOrigen: [{ origen: 'formulario-movil', responsableId: 'c' }] };
    expect(asignarResponsable({ origen: 'formulario-movil' }, responsables, regla).responsableId).toBe('c');
    expect(asignarResponsable({ origen: 'otro' }, responsables, regla).responsableId).toBe('a');
  });

  it('por carga elige al menos ocupado', () => {
    const d = asignarResponsable({ origen: 'web' }, responsables, { modo: 'carga' }, { abiertos: { a: 5, c: 2 } });
    expect(d.responsableId).toBe('c');
  });
});

describe('límite de envíos', () => {
  it('corta después del máximo', () => {
    const l = crearLimitador(2, 1000);
    expect(l.permitir('ip').ok).toBe(true);
    expect(l.permitir('ip').ok).toBe(true);
    expect(l.permitir('ip').ok).toBe(false);
    expect(l.permitir('otra').ok).toBe(true);
  });
});
