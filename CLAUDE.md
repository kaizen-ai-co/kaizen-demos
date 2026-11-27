# kaizen-demos · guía para Claude Code

Monorepo de las **seis plantillas de demo de Kaizen** sobre una base común, con inicio de sesión
con Google y editor de contenido propio en `/editar`. Responde y escribe en **español de Colombia**.

## Orden de lectura (antes de construir algo)

1. `docs/cuentas-y-roles.md` → 2. `docs/base-comun.md` → 3. `docs/motor-edicion.md` →
2. `docs/plantillas/0N-*.md` de la plantilla pedida → 5. `docs/calidad.md`.
   Decisiones vigentes y pendientes: `docs/decisiones.md`. Mapa de agentes: `docs/agentes.md`.

## Agentes (.claude/agents) y skills (.claude/skills)

- Empieza por **`orquestador-demos`** para cualquier pedido de varias partes; él delega.
- Skills: `/construir-plantilla`, `/nueva-demo-cliente`, `/agregar-bloque`, `/verificar-entrega`, `/registro-slack`.

## Comandos

```bash
npm install                      # una vez, en la raíz
npm run dev:comercial            # 3001 · presentacion 3002 · catalogo 3003 · visor3d 3004 · panel 3005 · agenda 3006
npm test                         # Vitest: lógica, contrato de datos, editor
npm run validar                  # esquemas + contraste (incluye tono sobre su tinte) + licencias + tipos + pruebas
npm run lint                     # ESLint: TypeScript, React 19, Next y accesibilidad (jsx-a11y) · 0 errores
npm run format                   # Prettier (la CI corre format:check)
npm run check                    # validar + lint + build de todo: antes de decir «listo»
npm run build -w @kaizen/app-<plantilla>
APP=<plantilla> PUERTO_DESFASE=100 npx playwright test pruebas/e2e/<plantilla>.spec.ts pruebas/e2e/acceso.spec.ts
                                 # e2e en 390 y 1440 px con axe (necesita el build); detalle en docs/calidad.md
npm run nueva-demo -- --plantilla comercial --sitio cliente-x --sector clinica
```

Local sin servicios externos: `.env.local` con `DATOS_PROVEEDOR=memoria` y `ENTRAR_COMO_PRUEBA=1`
→ `/editar` ofrece cuentas de prueba (Desarrollador, Administrador, Cliente, No autorizada).
No corras `next build`/`start` de una app mientras su `npm run dev` está abierto: comparten `apps/<app>/.next`.

Hooks (`.claude/settings.json`): al editar, Prettier sobre el archivo y validación de esquema/semilla;
al cerrar el turno, typecheck + lint con aviso. Si aparece el aviso, corrígelo antes de entregar.

## Mapa

```
packages/tema      tokens (tema.json) → variables CSS; contraste WCAG
packages/datos     interfaces + proveedores (memoria, firebase); acceso por rol; mapeo a CRM externo
packages/editor    esquema de contenido, validación, protección por rol, editor React, controles
packages/ui        primitivos estilo shadcn, bloques de página, formulario a lead
packages/modulos   lógica pura probada: totales, huecos (America/Bogota), asignación, límite de envíos
packages/nucleo    definirPlantilla(): rutas API, sesión, contenido, PaginaEditar, LayoutDemo (skip link),
                   metadatos (metadatosDemo, imagen OG, ícono, robots)
pruebas/e2e        un <plantilla>.spec.ts por app + acceso.spec.ts; ayudas.ts (axe, capturas)
semillas/          datos ficticios: base, sectores y demos de clientes (por plantilla)
apps/<plantilla>   comercial · presentacion · catalogo · visor3d · panel · agenda
```

## Reglas que no se negocian

- **Datos ficticios siempre** (Ley 1581). Nada de nombres, teléfonos o correos reales en semillas, pruebas o capturas.
- **Portabilidad**: las apps no importan SDKs de proveedores; todo por `@kaizen/datos` y variables de entorno.
  Prohibido `@vercel/*`, Edge Config, Blob, KV. La versión AWS **no se escribe** hasta que Santiago lo confirme.
- **Seguridad en servidor**: toda ruta protegida usa `exigir()`; el borrador nunca es público; ocultar botones no basta.
- **Todo lo visible se edita en /editar**: si escribes un texto fijo en JSX, probablemente debe ser un campo del esquema
  (con el texto actual como respaldo `texto(campo, '…')`). Excepciones a propósito: aviso legal de datos ficticios,
  placeholders ficticios, trampa para bots, «Vista previa del borrador» e interfaz interna (/editar, /panel, /calendario).
- **Solo tokens del tema** para color, tipografía, radios y sombras (también en el PDF, vía `resolverTema`).
- **Accesibilidad WCAG 2.2 AA**: `<main id="contenido" tabIndex={-1}>`, objetivos ≥ 24 px, nombre accesible = texto
  visible, foco que no salta al cargar. El e2e con axe no admite violaciones serias/críticas; no subas el umbral.
- **Lógica con números o fechas** en `packages/modulos` con pruebas.
- **Estado honesto**: cada app declara funciones disponibles / prototipo / pendientes en `lib/plantilla.ts`.
- **Licencias**: todo recurso externo en `LICENCIAS.md`; imágenes y modelos solo CC0 o comercial clara.
- **Registro**: al terminar, mensaje para el hilo de Slack del cliente o tarea (qué terminó, evidencia, qué sigue, qué bloquea).
- Precios, descuentos, alcance y fechas los decide Santiago: no los inventes.
- Repo en `kaizen-ai-co`, `main` protegido, PR con CI en verde.
