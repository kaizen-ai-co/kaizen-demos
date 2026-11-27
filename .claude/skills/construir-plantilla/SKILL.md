---
name: construir-plantilla
description: Construye o completa una de las seis plantillas de demo (comercial, presentacion, catalogo, visor3d, panel, agenda) siguiendo la guía paso a paso, con los agentes en orden y las reglas de calidad. Úsala cuando pidan "construye la plantilla N", "termina el catálogo" o "deja lista la agenda".
argument-hint: <comercial|presentacion|catalogo|visor3d|panel|agenda>
---

# Construir una plantilla

Plantilla pedida: **$ARGUMENTS**

## 0. Contexto (no lo saltes)
Lee en orden: `docs/cuentas-y-roles.md`, `docs/base-comun.md`, `docs/motor-edicion.md`,
`docs/plantillas/0N-$ARGUMENTS.md`, `docs/calidad.md`, `docs/decisiones.md`.
Mira cómo está hecha `apps/comercial/` (referencia completa) y el estado actual de `apps/$ARGUMENTS/`.

## 1. Plan
Lista los pasos del documento que faltan para esta plantilla y quién los hace (ver `docs/agentes.md`).
Prioriza el **recorrido principal con datos ficticios** antes que el pulido.

## 2. Ejecutar con los agentes (en este orden)
1. `arquitecto-nextjs` — solo si la app no compila o falta su estructura.
2. `ingeniero-editor` — `contenido.schema.json` con campos y rol por campo; controles propios si hacen falta.
3. `redactor-demos` — `semillas/$ARGUMENTS/contenido.json` (+ registros de ejemplo y un sector).
4. `desarrollador-frontend` (y `especialista-3d` en visor3d) — páginas y bloques.
5. `ingeniero-datos` — solo si hay colecciones u operaciones nuevas.
6. `ingeniero-pruebas` — lógica (Vitest) + recorrido en móvil y escritorio + acceso con 4 cuentas.
7. `auditor-seguridad` y `auditor-calidad` — en paralelo.
8. `revisor-codigo` → correcciones → `cronista-slack`.

## 3. Verificar tú mismo
```bash
npm run validar
npm run build -w @kaizen/app-$ARGUMENTS
DATOS_PROVEEDOR=memoria ENTRAR_COMO_PRUEBA=1 npm run dev:$ARGUMENTS
```
Recorre el paso «Probar» de la guía en el navegador (móvil 375 px y escritorio).

## 4. Está lista cuando
- El recorrido del paso «Probar» funciona de punta a punta con datos ficticios.
- El contenido se edita y publica sin tocar código (y Volver atrás funciona).
- Pasa todas las reglas de `docs/calidad.md`.
- `lib/plantilla.ts → funciones` dice con honestidad qué es disponible, prototipo o pendiente.

## 5. Cierre
Actualiza la tabla «Estado» de `docs/plantillas/0N-$ARGUMENTS.md` y entrega el mensaje para Slack (`/registro-slack`).
