import 'server-only';
import type { EsquemaContenido } from '@kaizen/editor';
import { definirPlantilla } from '@kaizen/nucleo/servidor';
import { resolverSemilla } from '@kaizen/semillas';
import leadsDemo from '@kaizen/semillas/panel/leads.json';
import esquema from '../contenido.schema.json';
import { asignarAlCrear } from './crm';

/**
 * Plantilla 5 · Panel de administración y CRM.
 * Recorrido: formulario móvil (/) → lead creado en la capa de datos y asignado por regla →
 * panel (/panel) → tablero por etapas con historial.
 *
 * La creación del lead pasa SOLO por la capa de datos (capa.leads.crear). Para conectar el CRM
 * de Jericó cuando un cliente pague, se registra un RepoLeads sustituto con MAPEO_JERICO
 * (ver docs/plantillas/05-panel.md); esta app no cambia.
 */
export const plantilla = definirPlantilla({
  plantilla: 'panel',
  sitioPorDefecto: 'demo-panel',
  esquema: esquema as EsquemaContenido,
  semilla: resolverSemilla('panel'),
  antesDeCrearLead: (lead, capa, contenido) => asignarAlCrear(lead, capa, contenido),
  async sembrarDatos(capa, sitioId) {
    for (const { nota, ...l } of leadsDemo as ((typeof leadsDemo)[number] & { nota?: string })[]) {
      const creado = await capa.leads.crear({ ...l, sitioId });
      if (nota) await capa.leads.actualizar(sitioId, creado.id, { nota }, 'sistema');
    }
  },
  funciones: [
    { nombre: 'Formulario móvil a lead', estado: 'disponible' },
    { nombre: 'Asignación automática (turnos, origen, carga)', estado: 'disponible' },
    { nombre: 'Tablero por etapas con arrastrar y soltar', estado: 'disponible' },
    { nombre: 'Historial de cambios del lead', estado: 'disponible' },
    { nombre: 'Métricas por etapa y responsable', estado: 'disponible' },
    { nombre: 'Conexión con el CRM de Jericó', estado: 'pendiente' },
    { nombre: 'Avisos por WhatsApp al responsable', estado: 'pendiente' },
  ],
});
