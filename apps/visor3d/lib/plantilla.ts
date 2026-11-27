import 'server-only';
import type { EsquemaContenido } from '@kaizen/editor';
import { definirPlantilla } from '@kaizen/nucleo/servidor';
import { resolverSemilla } from '@kaizen/semillas';
import leadsDemo from '@kaizen/semillas/visor3d/leads.json';
import esquema from '../contenido.schema.json';

/**
 * Plantilla 4 · Visor 3D de objetos.
 * Recorrido: el visitante gira y personaliza el objeto → "Solicitar esta configuración" →
 * lead con extra.configuracion (parte → opción) → vista "Configuraciones pedidas" en /editar.
 */
export const plantilla = definirPlantilla({
  plantilla: 'visor3d',
  sitioPorDefecto: 'demo-visor3d',
  esquema: esquema as EsquemaContenido,
  semilla: resolverSemilla('visor3d'),
  async sembrarDatos(capa, sitioId) {
    for (const l of leadsDemo) await capa.leads.crear({ ...l, sitioId });
  },
  limitesArchivos: { imagenes: 800_000, modelos: 15_000_000 },
  funciones: [
    { nombre: 'Visor 3D: girar, acercar y reiniciar vista', estado: 'disponible' },
    { nombre: 'Configurador de colores y materiales en vivo', estado: 'disponible' },
    { nombre: 'Solicitar configuración (lead con opciones elegidas)', estado: 'disponible' },
    { nombre: 'Subir modelo .glb y fijar cámara desde /editar', estado: 'disponible' },
    { nombre: 'Objeto de demostración (silla procedural, no un producto real)', estado: 'prototipo' },
    { nombre: 'Precio calculado según la configuración', estado: 'pendiente' },
    { nombre: 'Realidad aumentada en el celular', estado: 'pendiente' },
  ],
});
