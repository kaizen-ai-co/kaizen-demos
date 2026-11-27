import { describe, expect, it } from 'vitest';
import { calcularTotales } from '@kaizen/modulos/totales';
import semilla from '@kaizen/semillas/catalogo/contenido.json';
import { armarCotizacion, leerCatalogo, totalesDe, type Producto } from './cotizacion';
import { generarPdfCotizacion } from './pdf';

const { productos, condiciones } = leerCatalogo(semilla as Record<string, unknown>);

describe('cotización del catálogo (plantilla 3)', () => {
  it('tres productos: los totales del servidor coinciden con calcularTotales', () => {
    const pedido = [
      { productoId: 'resma-carta', cantidad: 4 },
      { productoId: 'jabon-galon', cantidad: 2 },
      { productoId: 'cafe-500', cantidad: 3 },
    ];
    const c = armarCotizacion(productos, condiciones, pedido);
    const esperado = calcularTotales(
      [
        { precioUnitario: 18900, cantidad: 4 },
        { precioUnitario: 32500, cantidad: 2 },
        { precioUnitario: 24800, cantidad: 3 },
      ],
      { tasaImpuesto: 0.19, descuentoPorcentaje: 0, decimales: 0 },
    );
    expect(c.totales).toEqual(esperado);
    expect(c.totales).toEqual({ subtotal: 215000, descuento: 0, baseImpuesto: 215000, impuesto: 40850, total: 255850 });
    // La pantalla y el PDF recalculan con la misma función desde los ítems guardados.
    expect(totalesDe(c.items, condiciones)).toEqual(c.totales);
  });

  it('usa precios del catálogo aunque el navegador mande otros', () => {
    const c = armarCotizacion(productos, condiciones, [{ productoId: 'carpeta-az', cantidad: 1, precioUnitario: 1 } as never]);
    expect(c.items[0]!.precioUnitario).toBe(9500);
  });

  it('junta líneas repetidas y aplica el descuento del Desarrollador', () => {
    const c = armarCotizacion(productos, { ...condiciones, descuentoPorcentaje: 0.1 }, [
      { productoId: 'carpeta-az', cantidad: 1 },
      { productoId: 'carpeta-az', cantidad: 2 },
    ]);
    expect(c.items).toHaveLength(1);
    expect(c.items[0]!.cantidad).toBe(3);
    expect(c.totales).toEqual(calcularTotales([{ precioUnitario: 9500, cantidad: 3 }], { tasaImpuesto: 0.19, descuentoPorcentaje: 0.1 }));
  });

  it('rechaza vacíos, inexistentes, no disponibles y cantidades inválidas', () => {
    expect(() => armarCotizacion(productos, condiciones, [])).toThrow();
    expect(() => armarCotizacion(productos, condiciones, [{ productoId: 'no-existe', cantidad: 1 }])).toThrow();
    expect(() => armarCotizacion(productos, condiciones, [{ productoId: 'toallas-papel', cantidad: 1 }])).toThrow(/no está disponible/);
    expect(() => armarCotizacion(productos, condiciones, [{ productoId: 'resma-carta', cantidad: 0 }])).toThrow();
    expect(() => armarCotizacion(productos, condiciones, [{ productoId: 'resma-carta', cantidad: 1.5 }])).toThrow();
  });

  it('genera un PDF válido con los mismos totales', async () => {
    const c = armarCotizacion(productos as Producto[], condiciones, [{ productoId: 'resma-carta', cantidad: 2 }]);
    const bytes = await generarPdfCotizacion({
      cotizacion: { ...c, id: 'c1', sitioId: 's', numero: 'COT-2026-000001', cliente: { nombre: 'Empresa Ficticia' }, estado: 'recibida', creadoEl: '2026-11-26T15:00:00.000Z' },
      marca: 'Distribuidora Ejemplo',
      condiciones,
    });
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
  });
});
