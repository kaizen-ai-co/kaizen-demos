/**
 * Alta, cambio y revocación de usuarios. SOLO con la cuenta de servicio del proyecto
 * (la custodia la cuenta oficial). No existe pantalla para esto en las plantillas.
 *
 *   npm run usuario -- --correo persona@lkaizen.com --rol administrador
 *   npm run usuario -- --correo cliente@empresa.com --rol cliente --sitio demo-cliente --dias 14
 *   npm run usuario -- --correo persona@lkaizen.com --revocar
 */
import { parseArgs } from 'node:util';
import { asignarRol } from '../packages/datos/src/firebase/index';
import type { Rol } from '../packages/datos/src/tipos';

const { values } = parseArgs({
  options: {
    correo: { type: 'string' },
    rol: { type: 'string' },
    sitio: { type: 'string' },
    dias: { type: 'string' },
    revocar: { type: 'boolean', default: false },
  },
});

const roles: Rol[] = ['desarrollador', 'administrador', 'cliente'];
const correo = values.correo?.toLowerCase();
if (!correo || (!values.revocar && !roles.includes(values.rol as Rol))) {
  console.error(
    'Uso: --correo <correo> --rol <desarrollador|administrador|cliente> [--sitio <id> --dias <n>] | --revocar',
  );
  process.exit(1);
}
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('Falta FIREBASE_SERVICE_ACCOUNT (cuenta de servicio del proyecto, custodiada por la cuenta oficial).');
  process.exit(1);
}

if (values.revocar) {
  await asignarRol(correo, { rol: 'administrador', activo: false });
  console.log(`✓ ${correo} revocado: sin claims, inactivo y sesiones cerradas.`);
} else {
  const rol = values.rol as Rol;
  if (rol === 'cliente' && (!values.sitio || !values.dias)) {
    console.error('El rol cliente exige --sitio y --dias (periodo de prueba).');
    process.exit(1);
  }
  const venceEl = rol === 'cliente' ? new Date(Date.now() + Number(values.dias) * 864e5).toISOString() : undefined;
  const r = await asignarRol(correo, {
    rol,
    activo: true,
    sitioId: rol === 'cliente' ? values.sitio : undefined,
    venceEl,
  });
  console.log(`✓ ${correo} → ${rol}${venceEl ? ` en ${values.sitio} hasta ${venceEl}` : ''}.`);
  if (!r.existeEnAuth)
    console.log(
      '  (Aún no ha entrado con Google: los claims se aplicarán cuando corras este comando de nuevo tras su primer ingreso.)',
    );
}
