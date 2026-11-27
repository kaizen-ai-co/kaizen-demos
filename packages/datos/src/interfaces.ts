import type {
  ArchivoSubido,
  CambiosLead,
  Cita,
  Cotizacion,
  DatosContenido,
  EstadoCita,
  FiltroLeads,
  Lead,
  NuevaCita,
  NuevaCotizacion,
  NuevoLead,
  ResultadoReserva,
  Usuario,
  VersionContenido,
} from './tipos';

/**
 * Contratos de la capa de datos. Cada proveedor (memoria, firebase y, cuando se
 * decida, otro) implementa TODOS estos métodos. Las apps nunca importan un SDK
 * de proveedor: piden `obtenerCapaDatos()` y usan esto.
 *
 * Para agregar un proveedor: crea `src/<proveedor>/index.ts` que exporte
 * `crearCapa<Proveedor>(): CapaDatos`, regístralo en `src/servidor.ts` y corre
 * `npm test` (la suite de contrato en `contrato.test.ts` se aplica a todos).
 */

export interface ProveedorIdentidad {
  /** Valida el token/cookie de sesión y devuelve el usuario con su rol, o null. */
  verificarSesion(credencial: string): Promise<Usuario | null>;
  /** Cambia un idToken del proveedor por una credencial de sesión de servidor. */
  crearSesion(idToken: string): Promise<{ credencial: string; expiraEnSegundos: number }>;
  /** Busca un usuario autorizado en la colección `usuarios`. */
  buscarUsuario(correo: string): Promise<Usuario | null>;
}

export interface RepoContenido {
  leerPublicado<T extends DatosContenido>(sitioId: string): Promise<VersionContenido<T> | null>;
  leerBorrador<T extends DatosContenido>(sitioId: string): Promise<VersionContenido<T> | null>;
  guardarBorrador<T extends DatosContenido>(sitioId: string, datos: T, autor: string): Promise<VersionContenido<T>>;
  /** Copia el borrador a publicado, archiva el publicado anterior y registra autor y fecha. */
  publicar(sitioId: string, autor: string): Promise<VersionContenido>;
  /** Restaura la versión publicada anterior (un clic en el editor). */
  volverAtras(sitioId: string, autor: string): Promise<VersionContenido | null>;
  historial(sitioId: string, limite?: number): Promise<VersionContenido[]>;
}

/**
 * Punto de conexión con CRMs externos (p. ej. Jericó): cuando un cliente pague,
 * se implementa un RepoLeads que escriba allá y se registra como proveedor de
 * leads, sin tocar las plantillas. Ver `mapeo-leads.ts`.
 */
export interface RepoLeads {
  crear(nuevo: NuevoLead): Promise<Lead>;
  listar(sitioId: string, filtro?: FiltroLeads): Promise<Lead[]>;
  obtener(sitioId: string, id: string): Promise<Lead | null>;
  actualizar(sitioId: string, id: string, cambios: CambiosLead, autor: string): Promise<Lead>;
}

export interface RepoCotizaciones {
  crear(nueva: NuevaCotizacion): Promise<Cotizacion>;
  listar(sitioId: string): Promise<Cotizacion[]>;
  obtener(sitioId: string, id: string): Promise<Cotizacion | null>;
  marcarRevisada(sitioId: string, id: string): Promise<void>;
}

export interface RepoCitas {
  /**
   * Verifica que el hueco siga libre y guarda la cita EN UNA SOLA OPERACIÓN
   * (transacción). Si otro visitante lo tomó, devuelve { ok: false, motivo: 'ocupado' }.
   */
  reservar(nueva: NuevaCita): Promise<ResultadoReserva>;
  listarRango(sitioId: string, desdeISO: string, hastaISO: string, profesionalId?: string): Promise<Cita[]>;
  cambiarEstado(sitioId: string, id: string, estado: EstadoCita): Promise<Cita>;
}

export interface AlmacenArchivos {
  subir(ruta: string, datos: Uint8Array, tipo: string): Promise<ArchivoSubido>;
  eliminar(ruta: string): Promise<void>;
}

/** Registros genéricos por sitio (configuraciones, métricas de demo, etc.). */
export interface RepoColeccion {
  guardar<T extends Record<string, unknown>>(sitioId: string, coleccion: string, id: string, datos: T): Promise<T>;
  leer<T extends Record<string, unknown>>(sitioId: string, coleccion: string, id: string): Promise<T | null>;
  listar<T extends Record<string, unknown>>(sitioId: string, coleccion: string): Promise<T[]>;
}

export interface CapaDatos {
  proveedor: string;
  identidad: ProveedorIdentidad;
  contenido: RepoContenido;
  leads: RepoLeads;
  cotizaciones: RepoCotizaciones;
  citas: RepoCitas;
  archivos: AlmacenArchivos;
  colecciones: RepoColeccion;
}
