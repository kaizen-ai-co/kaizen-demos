# kaizen-demos · guía para Claude Code

Monorepo de las **seis plantillas de demo de Kaizen** sobre una base común, con inicio de sesión
con Google y editor de contenido propio en `/editar`. Responde y escribe en **español de Colombia**.

## Orden de lectura (antes de construir algo)
1. `docs/cuentas-y-roles.md` → 2. `docs/base-comun.md` → 3. `docs/motor-edicion.md` →
4. `docs/plantillas/0N-*.md` de la plantilla pedida → 5. `docs/calidad.md`.
Decisiones vigentes y pendientes: `docs/decisiones.md`. Mapa de agentes: `docs/agentes.md`.

## Agentes (.claude/agents) y skills (.claude/skills)
- Empieza por **`orquestador-demos`** para cualquier pedido de varias partes; él delega.
- Skills: `/construir-plantilla`, `/nueva-demo-cliente`, `/agregar-bloque`, `/verificar-entrega`, `/registro-slack`.

## Comandos
```bash
npm install                      # una vez, en la raíz
npm run dev:comercial            # 3001 · presentacion 3002 · catalogo 3003 · visor3d 3004 · panel 3005 · agenda 3006
npm test                         # Vitest: lógica, contrato de datos, editor
npm run validar                  # esquemas + contraste + licencias + tipos + pruebas (lo que corre la CI)
npm run build -w @kaizen/app-<plantilla>
npm run nueva-demo -- --plantilla comercial --sitio cliente-x --sector clinica
```
Local sin servicios externos: `.env.local` con `DATOS_PROVEEDOR=memoria` y `ENTRAR_COMO_PRUEBA=1`
→ `/editar` ofrece cuentas de prueba (Desarrollador, Administrador, Cliente, No autorizada).

## Mapa
```
packages/tema      tokens (tema.json) → variables CSS; contraste WCAG
packages/datos     interfaces + proveedores (memoria, firebase); acceso por rol; mapeo a CRM externo
packages/editor    esquema de contenido, validación, protección por rol, editor React, controles
packages/ui        primitivos estilo shadcn, bloques de página, formulario a lead
packages/modulos   lógica pura probada: totales, huecos (America/Bogota), asignación, límite de envíos
packages/nucleo    definirPlantilla(): rutas API, sesión, contenido, PaginaEditar, LayoutDemo
semillas/          datos ficticios: base, sectores y demos de clientes (por plantilla)
apps/<plantilla>   comercial · presentacion · catalogo · visor3d · panel · agenda
```

## Reglas que no se negocian
- **Datos ficticios siempre** (Ley 1581). Nada de nombres, teléfonos o correos reales en semillas, pruebas o capturas.
- **Portabilidad**: las apps no importan SDKs de proveedores; todo por `@kaizen/datos` y variables de entorno.
  Prohibido `@vercel/*`, Edge Config, Blob, KV. La versión AWS **no se escribe** hasta que Santiago lo confirme.
- **Seguridad en servidor**: toda ruta protegida usa `exigir()`; el borrador nunca es público; ocultar botones no basta.
- **Todo lo visible se edita en /editar**: si escribes un texto fijo en JSX, probablemente debe ser un campo del esquema.
- **Solo tokens del tema** para color, tipografía, radios y sombras.
- **Lógica con números o fechas** en `packages/modulos` con pruebas.
- **Estado honesto**: cada app declara funciones disponibles / prototipo / pendientes en `lib/plantilla.ts`.
- **Licencias**: todo recurso externo en `LICENCIAS.md`; imágenes y modelos solo CC0 o comercial clara.
- **Registro**: al terminar, mensaje para el hilo de Slack del cliente o tarea (qué terminó, evidencia, qué sigue, qué bloquea).
- Precios, descuentos, alcance y fechas los decide Santiago: no los inventes.
- Repo en `kaizen-ai-co`, `main` protegido, PR con CI en verde.
