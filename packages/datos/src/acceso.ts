import type { ResultadoAcceso, Rol, Usuario } from './tipos';

/**
 * Reglas de acceso en un solo lugar. Las usan el servidor (rutas y acciones),
 * las pruebas y, como referencia, las reglas de Firestore/Storage (que repiten
 * la misma lógica del lado del proveedor). Ocultar botones NO basta.
 */

export const ROLES: readonly Rol[] = ['desarrollador', 'administrador', 'cliente'] as const;

export type Permiso =
  | 'contenido:leer-borrador'
  | 'contenido:editar'
  | 'contenido:publicar'
  | 'estructura:editar' // tema, orden y activación de secciones, variantes, módulos
  | 'reglas:editar' // reglas de asignación, huecos, impuestos, descuentos
  | 'leads:leer'
  | 'leads:gestionar'
  | 'cotizaciones:leer'
  | 'citas:gestionar'
  | 'archivos:subir'
  | 'registros:leer';

const PERMISOS: Record<Rol, readonly Permiso[]> = {
  desarrollador: [
    'contenido:leer-borrador', 'contenido:editar', 'contenido:publicar', 'estructura:editar',
    'reglas:editar', 'leads:leer', 'leads:gestionar', 'cotizaciones:leer', 'citas:gestionar',
    'archivos:subir', 'registros:leer',
  ],
  administrador: [
    'contenido:leer-borrador', 'contenido:editar', 'contenido:publicar', 'leads:leer',
    'leads:gestionar', 'cotizaciones:leer', 'citas:gestionar', 'archivos:subir',
  ],
  cliente: [
    'contenido:leer-borrador', 'contenido:editar', 'contenido:publicar', 'leads:leer',
    'leads:gestionar', 'cotizaciones:leer', 'citas:gestionar', 'archivos:subir',
  ],
};

export function permisosDe(rol: Rol): readonly Permiso[] {
  return PERMISOS[rol];
}

export function tienePermiso(usuario: Usuario | null | undefined, permiso: Permiso): boolean {
  return !!usuario && usuario.activo && PERMISOS[usuario.rol].includes(permiso);
}

/** Rol que se usa para filtrar campos del esquema: el cliente edita lo mismo que el administrador. */
export function rolDeEdicion(rol: Rol): 'desarrollador' | 'administrador' {
  return rol === 'desarrollador' ? 'desarrollador' : 'administrador';
}

/**
 * Decide si un usuario puede trabajar sobre un sitio concreto en este momento.
 * Orden: sesión → registrado → activo → periodo de prueba → sitio propio.
 */
export function evaluarAcceso(usuario: Usuario | null, sitioId: string, ahora: Date = new Date()): ResultadoAcceso {
  if (!usuario) return { ok: false, motivo: 'sin-sesion' };
  if (!ROLES.includes(usuario.rol)) return { ok: false, motivo: 'no-registrado', usuario };
  if (!usuario.activo) return { ok: false, motivo: 'inactivo', usuario };
  if (usuario.rol === 'cliente') {
    if (!usuario.venceEl || new Date(usuario.venceEl).getTime() <= ahora.getTime()) {
      return { ok: false, motivo: 'vencido', usuario };
    }
    if (!usuario.sitioId || usuario.sitioId !== sitioId) return { ok: false, motivo: 'otro-sitio', usuario };
  }
  return { ok: true, usuario };
}

export const MENSAJES_SIN_ACCESO: Record<Exclude<ResultadoAcceso, { ok: true }>['motivo'], string> = {
  'sin-sesion': 'Inicia sesión con tu cuenta de Google para editar esta demo.',
  'no-registrado': 'Sin acceso. Tu cuenta de Google no está autorizada para esta aplicación.',
  inactivo: 'Sin acceso. Tu cuenta está desactivada.',
  vencido: 'Sin acceso. El periodo de prueba de esta demo terminó. Escríbenos para continuar.',
  'otro-sitio': 'Sin acceso. Tu cuenta solo puede editar su propio sitio.',
};

/** Error tipado para que las rutas respondan 401/403 de forma uniforme. */
export class ErrorAcceso extends Error {
  constructor(public motivo: string, public estado: 401 | 403 = 403) {
    super(motivo);
    this.name = 'ErrorAcceso';
  }
}
