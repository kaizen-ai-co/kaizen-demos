import 'server-only';
import { tienePermiso, type Usuario } from '@kaizen/datos';
import { redirect } from 'next/navigation';
import { plantilla } from './plantilla';

/** Pantallas del panel: sin acceso o sin permiso → /editar (que pide Google o muestra «Sin acceso»). */
export async function protegerPanel(): Promise<Usuario> {
  const acceso = await plantilla.accesoActual();
  if (!acceso.ok || !tienePermiso(acceso.usuario, 'leads:leer')) redirect('/editar');
  return acceso.usuario;
}
