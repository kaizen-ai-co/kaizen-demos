/**
 * Cálculo ÚNICO de totales de cotización (plantilla 3).
 * Lo usan la pantalla "Mi cotización", el servidor al guardar y el PDF: así los
 * tres muestran siempre la misma cifra. Cualquier cambio aquí exige pruebas.
 *
 * Reglas:
 *  - subtotal = Σ precioUnitario × cantidad
 *  - descuento = subtotal × descuentoPorcentaje (0–1)
 *  - baseImpuesto = subtotal − descuento
 *  - impuesto = baseImpuesto × tasaImpuesto (0–1)
 *  - total = baseImpuesto + impuesto
 *  - Se redondea cada valor a `decimales` (0 para COP) con redondeo half-up.
 */

export interface LineaCalculo {
  precioUnitario: number;
  cantidad: number;
}

export interface CondicionesCalculo {
  /** 0.19 = 19 %. Lo configura solo el Desarrollador. */
  tasaImpuesto: number;
  /** 0.1 = 10 %. Lo configura solo el Desarrollador. */
  descuentoPorcentaje?: number;
  decimales?: number;
}

export interface TotalesCalculados {
  subtotal: number;
  descuento: number;
  baseImpuesto: number;
  impuesto: number;
  total: number;
}

export function redondear(valor: number, decimales = 0): number {
  const f = 10 ** decimales;
  return Math.round((valor + Number.EPSILON) * f) / f;
}

export function validarLinea(l: LineaCalculo): string | null {
  if (!Number.isFinite(l.precioUnitario) || l.precioUnitario < 0) return 'Precio inválido';
  if (!Number.isInteger(l.cantidad) || l.cantidad < 1) return 'La cantidad debe ser un entero mayor que cero';
  return null;
}

export function calcularTotales(lineas: LineaCalculo[], c: CondicionesCalculo): TotalesCalculados {
  const d = c.decimales ?? 0;
  const tasa = Math.min(Math.max(c.tasaImpuesto, 0), 1);
  const desc = Math.min(Math.max(c.descuentoPorcentaje ?? 0, 0), 1);
  for (const l of lineas) {
    const e = validarLinea(l);
    if (e) throw new Error(e);
  }
  const subtotal = redondear(lineas.reduce((s, l) => s + l.precioUnitario * l.cantidad, 0), d);
  const descuento = redondear(subtotal * desc, d);
  const baseImpuesto = redondear(subtotal - descuento, d);
  const impuesto = redondear(baseImpuesto * tasa, d);
  const total = redondear(baseImpuesto + impuesto, d);
  return { subtotal, descuento, baseImpuesto, impuesto, total };
}

/** Total de una línea (para mostrar en tablas). */
export const totalLinea = (l: LineaCalculo, decimales = 0) => redondear(l.precioUnitario * l.cantidad, decimales);
