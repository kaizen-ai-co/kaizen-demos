import type { ItemCotizacion, Totales } from '@kaizen/datos';
import { calcularTotales } from '@kaizen/modulos/totales';

/**
 * Lógica de la cotización de la plantilla 3 (pura, sin servidor ni React).
 * La usan: la API al guardar (precios del contenido publicado), la pantalla "Mi cotización"
 * y el PDF. Todos los totales salen de `calcularTotales` de @kaizen/modulos.
 */

export interface Producto {
  id: string;
  nombre: string;
  foto?: unknown;
  descripcion?: string;
  precio: number;
  unidad: string;
  categoria: string;
  disponible?: boolean;
}

export interface Categoria {
  id: string;
  nombre: string;
}

export interface Condiciones {
  validezDias: number;
  entrega: string;
  textoCotizacion?: string;
  moneda?: string;
  nombreImpuesto?: string;
  tasaImpuesto: number;
  descuentoPorcentaje?: number;
}

export interface LineaPedido {
  productoId: string;
  cantidad: number;
}

export const MAX_CANTIDAD = 9999;
export const MAX_LINEAS = 50;

const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/** Extrae productos, categorías y condiciones del contenido de la plantilla. */
export function leerCatalogo(datos: Record<string, unknown>) {
  const catalogo = (datos.catalogo ?? {}) as Record<string, unknown>;
  const c = (datos.condiciones ?? {}) as Partial<Condiciones>;
  const condiciones: Condiciones = {
    validezDias: Number(c.validezDias ?? 15),
    entrega: String(c.entrega ?? ''),
    textoCotizacion: c.textoCotizacion ? String(c.textoCotizacion) : undefined,
    moneda: String(c.moneda ?? 'COP'),
    nombreImpuesto: String(c.nombreImpuesto ?? 'IVA'),
    tasaImpuesto: Number(c.tasaImpuesto ?? 0),
    descuentoPorcentaje: Number(c.descuentoPorcentaje ?? 0),
  };
  return {
    productos: arr<Producto>(catalogo.productos),
    categorias: arr<Categoria>(catalogo.categorias),
    condiciones,
  };
}

export const decimalesDe = (moneda?: string) => (moneda === 'COP' || !moneda ? 0 : 2);

export function totalesDe(
  items: Pick<ItemCotizacion, 'precioUnitario' | 'cantidad'>[],
  condiciones: Condiciones,
): Totales {
  return calcularTotales(items, {
    tasaImpuesto: condiciones.tasaImpuesto,
    descuentoPorcentaje: condiciones.descuentoPorcentaje,
    decimales: decimalesDe(condiciones.moneda),
  });
}

export class ErrorPedido extends Error {}

/**
 * Arma la cotización con los precios del CATÁLOGO, nunca con los que mande el navegador.
 * Junta líneas repetidas, rechaza productos inexistentes o no disponibles y cantidades inválidas.
 */
export function armarCotizacion(productos: Producto[], condiciones: Condiciones, pedido: LineaPedido[]) {
  if (!Array.isArray(pedido) || pedido.length === 0) throw new ErrorPedido('La cotización está vacía.');
  if (pedido.length > MAX_LINEAS) throw new ErrorPedido(`Máximo ${MAX_LINEAS} productos por cotización.`);
  const cantidades = new Map<string, number>();
  for (const l of pedido) {
    const cantidad = Number(l?.cantidad);
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > MAX_CANTIDAD)
      throw new ErrorPedido('Revisa las cantidades.');
    const id = String(l?.productoId ?? '');
    cantidades.set(id, (cantidades.get(id) ?? 0) + cantidad);
  }
  const items: ItemCotizacion[] = [];
  for (const [id, cantidad] of cantidades) {
    const p = productos.find((x) => x.id === id);
    if (!p) throw new ErrorPedido('Uno de los productos ya no existe en el catálogo.');
    if (p.disponible === false) throw new ErrorPedido(`«${p.nombre}» no está disponible.`);
    if (cantidad > MAX_CANTIDAD) throw new ErrorPedido('Revisa las cantidades.');
    items.push({ productoId: p.id, nombre: p.nombre, unidad: p.unidad, precioUnitario: Number(p.precio), cantidad });
  }
  return {
    items,
    totales: totalesDe(items, condiciones),
    condiciones: {
      validezDias: condiciones.validezDias,
      tasaImpuesto: condiciones.tasaImpuesto,
      descuentoPorcentaje: condiciones.descuentoPorcentaje ?? 0,
      entrega: condiciones.entrega,
    },
  };
}
