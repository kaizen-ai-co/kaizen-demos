---
name: verificar-entrega
description: Corre todas las verificaciones de calidad de una plantilla o demo antes de entregarla (formato, lint, validaciones, tipos, pruebas, build, e2e con axe en 390 y 1440 px, acceso con 4 cuentas, Lighthouse, licencias, estado honesto) y produce el checklist con evidencia y veredicto. Úsala con "¿está lista la plantilla X?", "verifica antes del PR" o "revisa la demo antes de la reunión".
argument-hint: <plantilla> [sitio]
---

# Verificar una entrega

Objetivo: **$ARGUMENTS**. Reporta con evidencia; si algo falla, dilo con la salida exacta. No subas umbrales ni
desactives reglas para que algo pase.

## 1. Automático

```bash
npm run format:check                              # Prettier
npm run check                                     # validar (esquemas, contraste, licencias, tipos, pruebas) + lint + build
```

Si `npm run dev:<p>` está abierto, ciérralo antes del build: comparten `apps/<p>/.next`.

## 2. Recorrido, accesibilidad y acceso (e2e en memoria)

```bash
DATOS_PROVEEDOR=memoria npm run build -w @kaizen/app-<p>
APP=<p> PUERTO_DESFASE=100 npx playwright test pruebas/e2e/<p>.spec.ts pruebas/e2e/acceso.spec.ts
```

- Cubre el paso «Probar» de `docs/plantillas/0N-<p>.md` en 390×844 y 1440×900, axe (0 serias/críticas) en cada
  paso clave y las 4 cuentas (`acceso.spec.ts`). Capturas en `capturas/<p>/`.
- Si la plantilla no tiene `<p>.spec.ts`, créalo siguiendo `pruebas/e2e/catalogo.spec.ts` y `ayudas.ts`.
- Revisa a mano: Administrador no puede cambiar `_estructura` por API; `/?vista=borrador` sin sesión muestra lo
  publicado; con teclado, el primer Tab es «Saltar al contenido».

## 3. Rendimiento (Lighthouse, sin instalar en el repo)

```bash
DATOS_PROVEEDOR=memoria npm run start -w @kaizen/app-<p> -- --port 3200
npx -y lighthouse@13.6.0 http://localhost:3200/ --form-factor=mobile --output=json --output-path=lighthouse/<p>-movil.json
npx -y lighthouse@13.6.0 http://localhost:3200/ --preset=desktop --output=json --output-path=lighthouse/<p>-escritorio.json
```

Compara con los umbrales y la línea base de `docs/calidad.md` (SEO < 100 es esperado por el `noindex`).

## Salida

```
| Regla | Resultado | Evidencia |
|---|---|---|
| Sin datos reales | ✅/❌ | … |
| Portabilidad | | |
| Seguridad (4 cuentas) | | |
| Contenido editable | | |
| Accesibilidad (axe + teclado) | | |
| Recorrido 390 / 1440 | | |
| Controles automáticos (check + formato) | | |
| Lighthouse | | |
| Licencias | | |
| Estado honesto | | |
Veredicto: lista / no lista (motivo)
```

Cierra con `/registro-slack` para el hilo del cliente o la tarea.
