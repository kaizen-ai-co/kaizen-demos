import type { CapaDatos, Lead, NuevoLead } from '@kaizen/datos';
import type { Contenido, EsquemaContenido } from '@kaizen/editor';
import type { EstadoDeFuncion } from '@kaizen/ui';

/**
 * Configuración de una plantilla. Cada app la declara UNA vez en `lib/plantilla.ts`
 * y la pasa a `definirPlantilla()`, que devuelve rutas, lectura de contenido y
 * página /editar ya conectadas. Es el único punto donde una app se "enchufa" a la base.
 */
export interface ConfigPlantilla {
  /** comercial | presentacion | catalogo | visor3d | panel | agenda */
  plantilla: string;
  /** Sitio por defecto si no hay SITIO_ID en el entorno. */
  sitioPorDefecto: string;
  esquema: EsquemaContenido;
  /** Contenido ficticio con el que arranca una demo nueva (semillas/<plantilla>/contenido.json). */
  semilla: Contenido;
  /**
   * Siembra registros ficticios (leads, citas…) la primera vez que se abre la demo.
   * Se ejecuta una sola vez por sitio.
   */
  sembrarDatos?: (capa: CapaDatos, sitioId: string) => Promise<void>;
  /**
   * Gancho al crear un lead público: completa o asigna antes de guardar (p. ej. regla
   * de asignación del panel). Devuelve el lead ajustado.
   */
  antesDeCrearLead?: (lead: NuevoLead, capa: CapaDatos, contenido: Contenido) => Promise<NuevoLead>;
  /** Gancho después de crear un lead (p. ej. reenviar a un CRM externo como Jericó). */
  despuesDeCrearLead?: (lead: Lead, capa: CapaDatos) => Promise<void>;
  /** Estado honesto de cada función de la demo (se muestra al pie). */
  funciones?: { nombre: string; estado: EstadoDeFuncion }[];
  /** Límites de subida en bytes. */
  limitesArchivos?: { imagenes?: number; modelos?: number };
}
