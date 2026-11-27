/**
 * Modelo de datos compartido por las seis plantillas.
 * Si cambias un tipo aquí, corre `npm run typecheck`: todas las apps lo usan.
 */

// ── Identidad y roles ────────────────────────────────────────────────
/**
 * Roles de la aplicación (custom claim `rol` en el token).
 * - desarrollador: todo, incluidos tema, orden, módulos y registros técnicos.
 * - administrador: contenido, publicación y leads de cualquier sitio.
 * - cliente: como administrador, pero solo en SU sitio (`sitioId`) y hasta `venceEl`.
 *   (Decisión de Santiago 25/11: tercer rol con periodo de prueba y bloqueo automático.)
 */
export type Rol = 'desarrollador' | 'administrador' | 'cliente';

export interface Usuario {
  uid: string;
  correo: string;
  nombre?: string;
  rol: Rol;
  activo: boolean;
  /** Obligatorio para `cliente`: el único sitio que puede editar. */
  sitioId?: string;
  /** Fin del periodo de prueba del `cliente` (ISO 8601). Después queda bloqueado. */
  venceEl?: string;
}

export type MotivoSinAcceso = 'sin-sesion' | 'no-registrado' | 'inactivo' | 'vencido' | 'otro-sitio';

export type ResultadoAcceso =
  | { ok: true; usuario: Usuario }
  | { ok: false; motivo: MotivoSinAcceso; usuario?: Usuario };

// ── Contenido versionado ─────────────────────────────────────────────
export type EstadoContenido = 'borrador' | 'publicado' | 'archivado';

export type DatosContenido = Record<string, unknown>;

export interface VersionContenido<T extends DatosContenido = DatosContenido> {
  id: string;
  sitioId: string;
  estado: EstadoContenido;
  datos: T;
  actualizadoPor: string;
  actualizadoEl: string;
  publicadoPor?: string;
  publicadoEl?: string;
}

// ── Leads (plantillas 1, 2, 4 y 5) ───────────────────────────────────
export interface Contacto {
  correo?: string;
  telefono?: string;
}

export interface NotaLead {
  id: string;
  texto: string;
  autor: string;
  fecha: string;
}

export type TipoEvento = 'creado' | 'etapa' | 'responsable' | 'nota' | 'campo';

export interface EventoHistorial {
  tipo: TipoEvento;
  fecha: string;
  autor: string;
  de?: string;
  a?: string;
  detalle?: string;
}

export interface Lead {
  id: string;
  sitioId: string;
  nombre: string;
  contacto: Contacto;
  /** De dónde llegó: formulario-web, formulario-movil, visor3d, caso:<slug>… */
  origen: string;
  etapa: string;
  responsableId?: string;
  notas: NotaLead[];
  /** Campos configurables del formulario (los define el esquema de la plantilla). */
  campos: Record<string, unknown>;
  /** Datos propios de la plantilla, p. ej. la configuración 3D elegida. */
  extra?: Record<string, unknown>;
  historial: EventoHistorial[];
  creadoEl: string;
  actualizadoEl: string;
}

export interface NuevoLead {
  sitioId: string;
  nombre: string;
  contacto: Contacto;
  origen: string;
  campos?: Record<string, unknown>;
  extra?: Record<string, unknown>;
  etapa?: string;
  responsableId?: string;
}

export interface FiltroLeads {
  etapa?: string;
  responsableId?: string;
  origen?: string;
  texto?: string;
  limite?: number;
}

export type CambiosLead = Partial<Pick<Lead, 'etapa' | 'responsableId' | 'campos' | 'nombre' | 'contacto'>> & {
  nota?: string;
};

// ── Cotizaciones (plantilla 3) ───────────────────────────────────────
export interface ItemCotizacion {
  productoId: string;
  nombre: string;
  unidad: string;
  precioUnitario: number;
  cantidad: number;
}

export interface Totales {
  subtotal: number;
  descuento: number;
  baseImpuesto: number;
  impuesto: number;
  total: number;
}

export interface Cotizacion {
  id: string;
  sitioId: string;
  numero: string;
  cliente: { nombre: string; empresa?: string } & Contacto;
  items: ItemCotizacion[];
  totales: Totales;
  condiciones: { validezDias: number; tasaImpuesto: number; descuentoPorcentaje: number; entrega: string };
  estado: 'recibida' | 'revisada';
  creadoEl: string;
}

export type NuevaCotizacion = Omit<Cotizacion, 'id' | 'numero' | 'estado' | 'creadoEl'>;

// ── Citas (plantilla 6) ──────────────────────────────────────────────
export type EstadoCita = 'pendiente' | 'confirmada' | 'cancelada';

export interface Cita {
  id: string;
  sitioId: string;
  servicioId: string;
  profesionalId: string;
  /** ISO 8601 con zona (America/Bogota, -05:00). */
  inicio: string;
  fin: string;
  estado: EstadoCita;
  visitante: { nombre: string } & Contacto;
  creadoEl: string;
}

export type NuevaCita = Omit<Cita, 'id' | 'estado' | 'creadoEl'>;

export type ResultadoReserva = { ok: true; cita: Cita } | { ok: false; motivo: 'ocupado' };

// ── Archivos ─────────────────────────────────────────────────────────
export interface ArchivoSubido {
  ruta: string;
  url: string;
  tipo: string;
  bytes: number;
}
