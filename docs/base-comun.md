# Base común

Se hace una vez; las seis plantillas la reutilizan. Estado de cada paso del documento original:

| # | Paso | Estado | Dónde |
|---|---|---|---|
| 1 | Monorepo Next.js + Tailwind + shadcn/ui | ✅ | `package.json` (workspaces npm), `packages/*`, `apps/*`, `semillas/` |
| 2 | Sistema de diseño en tema.json → variables CSS | ✅ | `packages/tema` (`temaACss`, `base.css` con `@theme inline`) |
| 3 | Interfaces de lo que cambia entre entornos | ✅ | `packages/datos/src/interfaces.ts` (`CapaDatos`) |
| 4 | Entorno de pruebas Firebase | ✅ código · ⏳ proyecto | `packages/datos/src/firebase/*`. El proyecto lo crea la cuenta oficial (pedir a Santiago) |
| 5 | Producción AWS detrás de las mismas interfaces | ⏸️ en pausa | Decisión 25/11: no escribirla todavía. Se agrega como proveedor en `servidor.ts` |
| 6 | Inicio de sesión y roles + reglas | ✅ | `acceso.ts`, `nucleo/servidor/sesion.ts`, `firestore.rules`, `storage.rules` |
| 7 | Probar tres cuentas (+ Cliente) | ✅ automatizado en memoria | `contrato.test.ts`; manual con cuentas de prueba |
| 8 | Motor de edición como paquete compartido | ✅ | `packages/editor` |
| 9 | LICENCIAS.md | ✅ | `LICENCIAS.md` + `npm run validar:licencias` |
| 10 | Contenedor portable | ✅ | `Dockerfile` (standalone), `next.config.base.ts` |
| 11 | Integración continua | ✅ | `.github/workflows/ci.yml` |

## Arquitectura
```
 navegador ──► apps/<plantilla> (Next App Router)
                 │  page.tsx ── plantilla.obtenerContenido() ──► RenderizadorSecciones(bloques)
                 │  editar/  ── <PaginaEditar>  ──► <Editor> (cliente) ──► /api/editor/*
                 │  api/*    ── plantilla.rutas.* (una línea por ruta)
                 ▼
            packages/nucleo  definirPlantilla(config)
                 │  sesión (cookie) · exigir(permiso) · semilla automática · validación · fusionarSeguro
                 ▼
            packages/datos   obtenerCapaDatos()  ──►  memoria  |  firebase  |  (aws, cuando se apruebe)
```

### Por qué así
- **Una app por plantilla, delgada**: lo común vive en paquetes; una app es esquema + semilla + páginas propias.
- **`definirPlantilla()` es el único enchufe**: cambia la base y las seis apps la heredan.
- **Proveedor intercambiable** por `DATOS_PROVEEDOR`. Una pieza suelta (p. ej. leads hacia Jericó) se
  sustituye con `registrarSustituto('leads', repo)` sin tocar plantillas.
- **Semilla automática**: la primera visita a un sitio vacío publica la semilla ficticia y siembra registros
  de ejemplo (una vez por sitio). Una demo nueva se ve completa sin pasos manuales.

## Variables de entorno
Ver `.env.example`. Las mínimas: `DATOS_PROVEEDOR`, `SITIO_ID`, y para Firebase las `NEXT_PUBLIC_FIREBASE_*`
más `FIREBASE_SERVICE_ACCOUNT`. Opcional `SECTOR` para aplicar una capa de sector a la semilla.

## Firebase (cuando Santiago cree el proyecto con la cuenta oficial)
1. Activar Authentication → Google; Firestore (modo producción); Storage.
2. `npx firebase deploy --only firestore:rules,firestore:indexes,storage` (quien tenga acceso).
3. Crear una cuenta de servicio y guardar su JSON como `FIREBASE_SERVICE_ACCOUNT` en Vercel (nunca en el repo).
4. Dar de alta usuarios con `npm run usuario` (ver `cuentas-y-roles.md`).
5. Probar las reglas con el emulador: `npx firebase emulators:start` y las apps con las variables del emulador.
