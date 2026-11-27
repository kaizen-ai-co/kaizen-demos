# Reglas de calidad y entrega

Valen para las seis plantillas. **Una plantilla no está entregada si incumple alguna.**

| Regla                 | Cómo se comprueba                                                                                                       | Responsable                          |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Sin datos reales      | Revisión de `semillas/` y pruebas; correos `@ejemplo.test`/`@kaizen.test`                                               | auditor-seguridad                    |
| Portabilidad          | Sin `@vercel/*` ni SDKs en apps (`git grep -n "firebase" apps/` vacío); build standalone                                | revisor-codigo                       |
| Seguridad             | `exigir()` en rutas; pruebas de las cuentas Desarrollador, Administrador, Cliente y no autorizada                       | auditor-seguridad, ingeniero-pruebas |
| Contenido editable    | Todo texto, imagen, precio y dato visible sale del esquema                                                              | revisor-codigo                       |
| Recorrido completo    | `pruebas/e2e/<app>.spec.ts` con datos ficticios, en móvil (390×844) y escritorio (1440×900), con axe en cada paso clave | ingeniero-pruebas                    |
| Controles automáticos | `npm run check` (validar + lint + build) + formato + e2e con axe + capturas + Lighthouse                                | CI, auditor-calidad                  |
| Licencias             | Cada recurso externo en `LICENCIAS.md` (`npm run validar:licencias`)                                                    | auditor-calidad                      |
| Estado honesto        | `funciones` en `lib/plantilla.ts` y tabla «Qué incluye esta demo» al pie                                                | orquestador                          |
| Registro              | Mensaje en el hilo de Slack: terminado, evidencia, sigue, bloquea                                                       | cronista-slack                       |

## Umbrales

> Provisionales hasta que Lucas los fije (decisión pendiente). Si una métrica no tiene meta, se registra la línea base.

| Métrica                     | Móvil   | Escritorio |
| --------------------------- | ------- | ---------- |
| Lighthouse Rendimiento      | ≥ 80    | ≥ 90       |
| Lighthouse Accesibilidad    | ≥ 95    | ≥ 95       |
| Lighthouse Buenas prácticas | ≥ 90    | ≥ 90       |
| LCP                         | ≤ 2,5 s | ≤ 2,0 s    |
| CLS                         | ≤ 0,1   | ≤ 0,1      |
| axe serias/críticas         | 0       | 0          |
| Contraste de texto          | ≥ 4,5:1 | ≥ 4,5:1    |

### Línea base de Lighthouse (27/11/2026)

Portada de cada app, build de producción en modo memoria, `npx -y lighthouse@13.6.0` en este equipo
(Windows, Chrome sin interfaz). Reportes JSON en `lighthouse/` (ignorada por git).

| App          | Modo       | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP (s) | CLS |
| ------------ | ---------- | ----------- | ------------- | ---------------- | --- | ------- | --- |
| presentacion | móvil      | 100         | 100           | 100              | 92  | 1,0     | 0   |
| presentacion | escritorio | 100         | 100           | 100              | 92  | 0,3     | 0   |
| catalogo     | móvil      | 100         | 98            | 100              | 92  | 0,8     | 0   |
| catalogo     | escritorio | 100         | 98            | 100              | 92  | 0,2     | 0   |
| visor3d      | móvil      | 81          | 100           | 100              | 91  | 0,8     | 0   |
| visor3d      | escritorio | 100         | 100           | 100              | 91  | 0,2     | 0   |
| panel        | móvil      | 100         | 100           | 100              | 91  | 0,8     | 0   |
| panel        | escritorio | 100         | 100           | 100              | 91  | 0,2     | 0   |
| agenda       | móvil      | 100         | 100           | 100              | 91  | 0,9     | 0   |
| agenda       | escritorio | 100         | 100           | 100              | 91  | 0,2     | 0   |

- `comercial` sin medir todavía (su `.next` lo usaba un `next dev` abierto).
- SEO < 100 es esperado: las demos llevan `noindex` a propósito (datos ficticios).
- visor3d móvil (81) es el más justo frente al umbral de 80: lo pesa three.js; vigilarlo si crece.

El contraste también se valida para el texto de cada tono (`exito`, `aviso`, `peligro`) sobre su propio
tinte al 15 % (insignias y avisos), en el tema base y en los colores propios de cada demo.

## Cómo correr el e2e

```bash
DATOS_PROVEEDOR=memoria npm run build -w @kaizen/app-<app>
APP=<app> PUERTO_DESFASE=100 npx playwright test pruebas/e2e/<app>.spec.ts pruebas/e2e/acceso.spec.ts
```

`PUERTO_DESFASE=100` evita chocar con un `npm run dev` abierto. El servidor en memoria limita a 5 envíos
por hora por IP: no repitas la corrida muchas veces contra el mismo servidor (`--repeat-each`) o dará 429.

## Checklist de entrega (copiar en el PR)

```
- [ ] npm run check en verde (validar + lint + build) y npm run format:check
- [ ] e2e de la app en verde en 390 y 1440 px, sin violaciones axe serias/críticas (capturas)
- [ ] acceso probado con las 4 cuentas
- [ ] Lighthouse móvil/escritorio dentro de umbral (o línea base registrada)
- [ ] LICENCIAS.md al día
- [ ] funciones con estado honesto
- [ ] mensaje para Slack listo
```
