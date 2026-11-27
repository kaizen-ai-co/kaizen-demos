# Kaizen · plantillas de demo

Seis plantillas de demo sobre una base común: inicio de sesión con Google, editor de contenido propio en
`/editar` (borrador, vista previa, publicar, volver atrás) y una capa de datos intercambiable
(memoria local · Firebase en pruebas · otro proveedor cuando se decida).

| # | Plantilla | Recorrido | Puerto local |
|---|---|---|---|
| 1 | `apps/comercial` | Formulario → lead | 3001 |
| 2 | `apps/presentacion` | Galería de casos → contacto | 3002 |
| 3 | `apps/catalogo` | Catálogo → cotización (pantalla y PDF) | 3003 |
| 4 | `apps/visor3d` | Visor 3D → configuración guardada como lead | 3004 |
| 5 | `apps/panel` | Formulario móvil → lead asignado → tablero | 3005 |
| 6 | `apps/agenda` | Reserva → calendario sin doble reserva | 3006 |

## Empezar
```bash
npm install
cp .env.example .env.local        # DATOS_PROVEEDOR=memoria, ENTRAR_COMO_PRUEBA=1
npm run dev:comercial             # http://localhost:3001  ·  /editar con cuentas de prueba
npm run validar                   # lo mismo que corre la CI
```

## Trabajar con Claude Code
Abre el repo en Claude Code: `CLAUDE.md` le da las reglas y el orden de lectura.
- Agentes en `.claude/agents/` (empieza por `orquestador-demos`). Mapa y contrato: `docs/agentes.md`.
- Skills: `/construir-plantilla <p>`, `/nueva-demo-cliente <cliente>`, `/agregar-bloque`, `/verificar-entrega`, `/registro-slack`.
- Hook: al editar un esquema o una semilla, se valida solo y Claude corrige en el mismo turno.

## Documentación
`docs/cuentas-y-roles.md` · `docs/base-comun.md` · `docs/motor-edicion.md` · `docs/plantillas/` ·
`docs/calidad.md` · `docs/decisiones.md` · `docs/flujo-demo-cliente.md` · `docs/despliegue.md`
