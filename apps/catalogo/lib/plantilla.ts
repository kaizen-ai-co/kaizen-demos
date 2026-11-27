import 'server-only';
import type { EsquemaContenido } from '@kaizen/editor';
import { definirPlantilla } from '@kaizen/nucleo/servidor';
import { resolverSemilla } from '@kaizen/semillas';
import esquema from '../contenido.schema.json';
import { armarCotizacion, leerCatalogo } from './cotizacion';

/**
 * Plantilla 3 · Catálogo y cotización.
 * Recorrido: catálogo → "Mi cotización" (productos y cantidades) → datos del visitante →
 * cotización en pantalla + PDF → aparece en la vista "Cotizaciones" del editor.
 */
export const plantilla = definirPlantilla({
  plantilla: 'catalogo',
  sitioPorDefecto: 'demo-catalogo',
  esquema: esquema as EsquemaContenido,
  semilla: resolverSemilla('catalogo'),
  async sembrarDatos(capa, sitioId) {
    // Una cotización de ejemplo para que la vista del editor no arranque vacía.
    const { productos, condiciones } = leerCatalogo(resolverSemilla('catalogo'));
    const disponibles = productos.filter((p) => p.disponible !== false).slice(0, 2);
    if (!disponibles.length) return;
    const c = armarCotizacion(
      productos,
      condiciones,
      disponibles.map((p, i) => ({ productoId: p.id, cantidad: i + 2 })),
    );
    await capa.cotizaciones.crear({
      sitioId,
      cliente: { nombre: 'Empresa Ficticia S.A.S.', correo: 'compras@ejemplo.test' },
      ...c,
    });
  },
  funciones: [
    { nombre: 'Catálogo con filtros y búsqueda', estado: 'disponible' },
    { nombre: 'Mi cotización con totales e impuesto', estado: 'disponible' },
    { nombre: 'Cotización guardada y visible en el editor', estado: 'disponible' },
    { nombre: 'PDF de la cotización', estado: 'prototipo' },
    { nombre: 'Importación de productos desde CSV', estado: 'prototipo' },
    { nombre: 'Envío de la cotización por correo', estado: 'pendiente' },
  ],
});
