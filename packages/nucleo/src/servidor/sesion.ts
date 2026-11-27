import 'server-only';
import {
  ErrorAcceso,
  evaluarAcceso,
  tienePermiso,
  type Permiso,
  type ResultadoAcceso,
  type Usuario,
} from '@kaizen/datos';
import { obtenerCapaDatos } from '@kaizen/datos/servidor';
import { cookies } from 'next/headers';

export const COOKIE_SESION = 'kz_sesion';

/** Usuario de la cookie de sesión (o null). Siempre verificado en el servidor. */
export async function usuarioActual(): Promise<Usuario | null> {
  const credencial = (await cookies()).get(COOKIE_SESION)?.value;
  if (!credencial) return null;
  const capa = await obtenerCapaDatos();
  return capa.identidad.verificarSesion(credencial);
}

export async function accesoActual(sitioId: string): Promise<ResultadoAcceso> {
  return evaluarAcceso(await usuarioActual(), sitioId);
}

/** Lanza ErrorAcceso (401/403) si no hay acceso al sitio o falta el permiso. */
export async function exigir(sitioId: string, permiso: Permiso): Promise<Usuario> {
  const acceso = await accesoActual(sitioId);
  if (!acceso.ok) throw new ErrorAcceso(acceso.motivo, acceso.motivo === 'sin-sesion' ? 401 : 403);
  if (!tienePermiso(acceso.usuario, permiso)) throw new ErrorAcceso(`Falta el permiso ${permiso}`, 403);
  return acceso.usuario;
}

/** El selector de cuentas de prueba solo existe en local con el proveedor en memoria. */
export function modoInicioSesion(): 'google' | 'prueba' {
  const proveedor = process.env.DATOS_PROVEEDOR ?? 'memoria';
  if (proveedor === 'memoria' && process.env.ENTRAR_COMO_PRUEBA === '1' && process.env.VERCEL !== '1') return 'prueba';
  return 'google';
}
