import 'server-only';
import type { EsquemaContenido } from '@kaizen/editor';
import { definirPlantilla } from '@kaizen/nucleo/servidor';
import { resolverSemilla } from '@kaizen/semillas';
import leadsDemo from '@kaizen/semillas/presentacion/leads.json';
import esquema from '../contenido.schema.json';

/**
 * Plantilla 2 · Presentación corporativa y portafolio.
 * Recorrido: galería de casos → detalle /casos/<id> → "Quiero algo así" → formulario con el caso → lead.
 */
export const plantilla = definirPlantilla({
  plantilla: 'presentacion',
  sitioPorDefecto: 'demo-presentacion',
  esquema: esquema as EsquemaContenido,
  semilla: resolverSemilla('presentacion'),
  async sembrarDatos(capa, sitioId) {
    for (const l of leadsDemo) await capa.leads.crear({ ...l, sitioId });
  },
  funciones: [
    { nombre: 'Galería de casos con filtro por sector', estado: 'disponible' },
    { nombre: 'Página de detalle por caso (generada)', estado: 'disponible' },
    { nombre: 'Del caso al formulario con el caso indicado', estado: 'disponible' },
    { nombre: 'Equipo y casos reordenables desde el editor', estado: 'disponible' },
    { nombre: 'Versión en inglés', estado: 'pendiente' },
  ],
});
