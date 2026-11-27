# Cuentas y roles

Editar cualquier plantilla exige iniciar sesión con Google. Una **cuenta oficial** administra
todas las cuentas. En la aplicación existen **tres roles** (el tercero, *Cliente*, lo aprobó
Santiago el 25/11).

| Cuenta / rol | Quién | Qué puede hacer |
|---|---|---|
| Cuenta oficial | La empresa (custodia: Santiago; tiene respaldo) | Dueña del proyecto de Google/Firebase y del equipo de Vercel. Crea, cambia y revoca cuentas y roles. Nadie más. Verificación en dos pasos; no se usa para editar contenido |
| `desarrollador` | Equipo técnico | Todo lo del Administrador + tema, orden, activación y variantes de secciones, módulos, reglas de negocio (impuesto, descuentos, asignación, huecos), vista de borradores y registros técnicos |
| `administrador` | Quien opera la demo | Textos, imágenes, precios y datos de la demo; publicar y volver atrás; ver leads, cotizaciones y citas; cualquier sitio |
| `cliente` | El cliente que prueba su demo | Lo mismo que el Administrador, **solo en su sitio** (`sitioId`) y **solo hasta `venceEl`**; al vencer queda bloqueado solo. Editar con datos reales ya es servicio pagado (Ley 1581) |

## Cómo está implementado
| Regla | Dónde |
|---|---|
| Solo Google, sin contraseñas | `packages/datos/src/firebase/cliente.ts` (popup) → `POST /api/sesion` crea cookie de sesión `httpOnly` |
| Lista de usuarios autorizados | colección `usuarios/{correo}` = `{ correo, rol, activo, sitioId?, venceEl? }` |
| Rol en el token | custom claims `rol`, `sitioId`, `venceEl` (los pone `scripts/gestionar-usuario.ts`) |
| Decisión de acceso | `evaluarAcceso()` en `packages/datos/src/acceso.ts`: sesión → registrado → activo → vigencia → sitio |
| Permisos por rol | `PERMISOS` en `acceso.ts` (`contenido:editar`, `estructura:editar`, `reglas:editar`, …) |
| Comprobación en cada ruta | `exigir(sitioId, permiso)` en `packages/nucleo/src/servidor/sesion.ts` |
| Campos por rol en el editor | `filtrarPorRol()` (lo que se ve) + `fusionarSeguro()` (lo que el servidor acepta) |
| Segunda barrera en Firebase | `firestore.rules` y `storage.rules` (misma lógica que `acceso.ts`) |
| Sin acceso | Pantalla «Sin acceso» con el motivo (`MENSAJES_SIN_ACCESO`) y nada más |

## Gestionar usuarios (solo cuenta oficial)
No hay pantalla en las plantillas. Con la cuenta de servicio del proyecto (que custodia la cuenta oficial):
```bash
FIREBASE_SERVICE_ACCOUNT="$(cat cuenta-servicio.json)" npm run usuario -- --correo persona@lkaizen.com --rol administrador
npm run usuario -- --correo cliente@empresa.com --rol cliente --sitio demo-cliente-x --dias 14
npm run usuario -- --correo persona@lkaizen.com --revocar
```
El script pone los claims, actualiza `usuarios/{correo}` y revoca las sesiones abiertas para que el
cambio aplique al instante.

## Probar acceso (paso 7 de la base)
Local con `DATOS_PROVEEDOR=memoria` y `ENTRAR_COMO_PRUEBA=1`: `/editar` ofrece cuatro cuentas.
| Cuenta | Esperado |
|---|---|
| desarrollador@kaizen.test | Editor + pestaña Estructura + campos «Dev» |
| administrador@kaizen.test | Editor sin Estructura ni campos Dev; un PUT manipulado no cambia nada reservado |
| cliente@kaizen.test | Solo si `SITIO_ID` coincide con su sitio (por defecto `demo`); si no, «Sin acceso» |
| nadie@kaizen.test | «Sin acceso»; todas las API protegidas → 403 |
