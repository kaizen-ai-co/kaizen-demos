import 'server-only';
import type { EsquemaContenido } from '@kaizen/editor';
import { definirPlantilla } from '@kaizen/nucleo/servidor';
import { resolverSemilla } from '@kaizen/semillas';
import esquema from '../contenido.schema.json';
import leadsDemo from '@kaizen/semillas/comercial/leads.json';

/**
 * Plantilla 1 · Sitio comercial de servicios.
 * Recorrido: visitante → formulario → lead en sitios/{sitioId}/leads → vista "Leads" en /editar.
 */
export const plantilla = definirPlantilla({
  plantilla: 'comercial',
  sitioPorDefecto: 'demo-comercial',
  esquema: esquema as EsquemaContenido,
  semilla: resolverSemilla('comercial'),
  async sembrarDatos(capa, sitioId) {
    for (const l of leadsDemo) await capa.leads.crear({ ...l, sitioId });
  },
  funciones: [
    { nombre: 'Formulario a lead', estado: 'disponible' },
    { nombre: 'Vista de leads en el editor', estado: 'disponible' },
    { nombre: 'Edición de contenido sin código', estado: 'disponible' },
    { nombre: 'Notificación al equipo por WhatsApp', estado: 'pendiente' },
  ],
});
