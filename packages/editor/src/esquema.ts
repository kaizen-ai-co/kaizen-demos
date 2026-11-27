/**
 * Formato de `contenido.schema.json` (uno por plantilla).
 *
 * El esquema describe QUÉ se edita; el editor genera el formulario y el
 * servidor valida y protege los campos por rol con este mismo archivo.
 * Autocompletado en el IDE: agrega
 *   "$schema": "../../packages/editor/esquema.meta.json"
 * al principio del archivo.
 */

export type RolEdicion = 'administrador' | 'desarrollador';

export type TipoCampoBase =
  | 'texto'
  | 'textoLargo'
  | 'numero'
  | 'precio'
  | 'porcentaje'
  | 'booleano'
  | 'imagen'
  | 'modelo3d'
  | 'color'
  | 'seleccion'
  | 'multiseleccion'
  | 'enlace'
  | 'correo'
  | 'telefono'
  | 'icono'
  | 'fecha'
  | 'hora'
  | 'lista'
  | 'grupo';

/** Los tipos propios de una plantilla (p. ej. `horarioSemanal`, `vistaCamara`) se registran con `registrarControl`. */
export type TipoCampo = TipoCampoBase | (string & {});

export interface Opcion {
  valor: string;
  etiqueta: string;
}

export interface Campo {
  id: string;
  etiqueta: string;
  tipo: TipoCampo;
  ayuda?: string;
  placeholder?: string;
  requerido?: boolean;
  /** Quién puede editarlo. Por defecto: administrador (y cliente). */
  rol?: RolEdicion;
  porDefecto?: unknown;
  /** texto: largo mínimo/máximo · numero/precio: valor mínimo/máximo. */
  min?: number;
  max?: number;
  paso?: number;
  patron?: string;
  /** imagen/modelo3d: tamaño máximo en bytes y extensiones aceptadas. */
  maxBytes?: number;
  formatos?: string[];
  opciones?: (Opcion | string)[];
  /** lista/grupo: campos de cada elemento. */
  campos?: Campo[];
  minItems?: number;
  maxItems?: number;
  ordenable?: boolean;
  /** lista: id del campo que se usa como título del elemento en el editor. */
  campoTitulo?: string;
  /** lista: nombre singular para el botón "Agregar …". */
  nombreItem?: string;
  /** Propiedades libres para controles propios. */
  props?: Record<string, unknown>;
}

export interface Seccion {
  id: string;
  titulo: string;
  descripcion?: string;
  campos: Campo[];
  /** El Desarrollador puede mostrarla u ocultarla. */
  activable?: boolean;
  /** Variantes visuales del bloque; el Desarrollador elige una. */
  variantes?: string[];
  /** Si toda la sección es solo del Desarrollador (p. ej. reglas de asignación). */
  rol?: RolEdicion;
}

export interface EsquemaContenido {
  $schema?: string;
  plantilla: string;
  version: number;
  titulo: string;
  secciones: Seccion[];
  /** Pestañas de solo lectura que la app agrega al editor (leads, cotizaciones…). */
  vistas?: { id: string; titulo: string; permiso?: string }[];
}

/** Datos de estructura que solo edita el Desarrollador. */
export interface Estructura {
  orden: string[];
  ocultas: string[];
  variantes: Record<string, string>;
  tema?: { colores?: Record<string, string>; coloresOscuro?: Record<string, string> };
}

export const CLAVE_ESTRUCTURA = '_estructura';

export type Contenido = Record<string, unknown> & { [CLAVE_ESTRUCTURA]?: Estructura };

export interface ValorImagen {
  url: string;
  ruta?: string;
  alt?: string;
  bytes?: number;
}

export const normalizarOpciones = (ops: Campo['opciones'] = []): Opcion[] =>
  ops.map((o) => (typeof o === 'string' ? { valor: o, etiqueta: o } : o));

export function valorPorDefecto(campo: Campo): unknown {
  if (campo.porDefecto !== undefined) return structuredClone(campo.porDefecto);
  switch (campo.tipo) {
    case 'booleano': return false;
    case 'numero': case 'precio': case 'porcentaje': return campo.min ?? 0;
    case 'lista': case 'multiseleccion': return [];
    case 'grupo': return objetoPorDefecto(campo.campos ?? []);
    case 'imagen': case 'modelo3d': return null;
    case 'seleccion': return normalizarOpciones(campo.opciones)[0]?.valor ?? '';
    default: return '';
  }
}

export function objetoPorDefecto(campos: Campo[]): Record<string, unknown> {
  return Object.fromEntries(campos.map((c) => [c.id, valorPorDefecto(c)]));
}

export function estructuraPorDefecto(esquema: EsquemaContenido): Estructura {
  return {
    orden: esquema.secciones.map((s) => s.id),
    ocultas: [],
    variantes: Object.fromEntries(esquema.secciones.filter((s) => s.variantes?.length).map((s) => [s.id, s.variantes![0]!])),
  };
}

/** Contenido vacío pero válido en forma, a partir del esquema. */
export function contenidoInicial(esquema: EsquemaContenido): Contenido {
  const c: Contenido = {};
  for (const s of esquema.secciones) c[s.id] = objetoPorDefecto(s.campos);
  c[CLAVE_ESTRUCTURA] = estructuraPorDefecto(esquema);
  return c;
}

/** Completa con valores por defecto lo que falte (útil tras agregar campos a un esquema). */
export function completarContenido(esquema: EsquemaContenido, datos: Contenido): Contenido {
  const base = contenidoInicial(esquema);
  const salida: Contenido = { ...base, ...datos };
  for (const s of esquema.secciones) {
    salida[s.id] = { ...(base[s.id] as object), ...((datos[s.id] as object) ?? {}) };
  }
  const est = { ...base[CLAVE_ESTRUCTURA]!, ...(datos[CLAVE_ESTRUCTURA] ?? {}) };
  // Secciones nuevas en el esquema que no estaban en el orden guardado van al final.
  for (const s of esquema.secciones) if (!est.orden.includes(s.id)) est.orden.push(s.id);
  est.orden = est.orden.filter((id) => esquema.secciones.some((s) => s.id === id));
  salida[CLAVE_ESTRUCTURA] = est;
  return salida;
}

/** Secciones visibles en el orden elegido, con su variante. Lo usan las páginas públicas. */
export function seccionesVisibles(esquema: EsquemaContenido, datos: Contenido) {
  const est = datos[CLAVE_ESTRUCTURA] ?? estructuraPorDefecto(esquema);
  return est.orden
    .filter((id) => !est.ocultas.includes(id))
    .map((id) => esquema.secciones.find((s) => s.id === id))
    .filter((s): s is Seccion => !!s)
    .map((s) => ({ id: s.id, variante: est.variantes[s.id] ?? s.variantes?.[0], datos: (datos[s.id] ?? {}) as Record<string, unknown> }));
}

export function slug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}
