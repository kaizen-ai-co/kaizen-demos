---
name: verificar-entrega
description: Corre todas las verificaciones de calidad de una plantilla o demo antes de entregarla (validaciones, tipos, pruebas, build, recorrido, acceso con 4 cuentas, Lighthouse, licencias, estado honesto) y produce el checklist con evidencia. Úsala con "¿está lista la plantilla X?", "verifica antes del PR" o "revisa la demo antes de la reunión".
argument-hint: <plantilla> [sitio]
---

# Verificar una entrega

Objetivo: **$ARGUMENTS**. Reporta con evidencia; si algo falla, dilo con la salida exacta.

## Automático
```bash
npm run validar                                   # esquemas, contraste, licencias, tipos, pruebas
npm run build -w @kaizen/app-<p>
```

## Recorrido y acceso (servidor local en memoria)
```bash
DATOS_PROVEEDOR=memoria ENTRAR_COMO_PRUEBA=1 npm run build -w @kaizen/app-<p>
DATOS_PROVEEDOR=memoria ENTRAR_COMO_PRUEBA=1 npm run start -w @kaizen/app-<p>
```
- Recorrido del paso «Probar» de `docs/plantillas/0N-<p>.md` en 375×812 y 1280×800 (capturas).
- `curl` a las API protegidas: sin sesión 401, cuenta no autorizada 403.
- Administrador: un PUT con `_estructura` cambiado no lo cambia (el servidor lo revierte).
- `/?vista=borrador` sin sesión muestra lo publicado.
- Si existe `pruebas/e2e/<p>.spec.ts`: `npx playwright test pruebas/e2e/<p>.spec.ts`.

## Rendimiento y accesibilidad
Delegar en `auditor-calidad` (Lighthouse móvil/escritorio, axe). Umbrales en `docs/calidad.md`;
si no hay meta, registrar la línea base.

## Salida
```
| Regla | Resultado | Evidencia |
|---|---|---|
| Sin datos reales | ✅/❌ | … |
| Portabilidad | | |
| Seguridad (4 cuentas) | | |
| Contenido editable | | |
| Recorrido móvil / escritorio | | |
| Controles automáticos | | |
| Licencias | | |
| Estado honesto | | |
Veredicto: lista / no lista (motivo)
```
