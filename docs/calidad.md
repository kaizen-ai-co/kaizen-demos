# Reglas de calidad y entrega

Valen para las seis plantillas. **Una plantilla no está entregada si incumple alguna.**

| Regla | Cómo se comprueba | Responsable |
|---|---|---|
| Sin datos reales | Revisión de `semillas/` y pruebas; correos `@ejemplo.test`/`@kaizen.test` | auditor-seguridad |
| Portabilidad | Sin `@vercel/*` ni SDKs en apps (`git grep -n "firebase" apps/` vacío); build standalone | revisor-codigo |
| Seguridad | `exigir()` en rutas; pruebas de las cuentas Desarrollador, Administrador, Cliente y no autorizada | auditor-seguridad, ingeniero-pruebas |
| Contenido editable | Todo texto, imagen, precio y dato visible sale del esquema | revisor-codigo |
| Recorrido completo | Recorrido principal con datos ficticios, en móvil (375×812) y escritorio (1280×800) | ingeniero-pruebas |
| Controles automáticos | `npm run validar` + build + capturas + Lighthouse + contraste en umbral | CI, auditor-calidad |
| Licencias | Cada recurso externo en `LICENCIAS.md` (`npm run validar:licencias`) | auditor-calidad |
| Estado honesto | `funciones` en `lib/plantilla.ts` y tabla «Qué incluye esta demo» al pie | orquestador |
| Registro | Mensaje en el hilo de Slack: terminado, evidencia, sigue, bloquea | cronista-slack |

## Umbrales
> Provisionales hasta que Lucas los fije (decisión pendiente). Si una métrica no tiene meta, se registra la línea base.

| Métrica | Móvil | Escritorio |
|---|---|---|
| Lighthouse Rendimiento | ≥ 80 | ≥ 90 |
| Lighthouse Accesibilidad | ≥ 95 | ≥ 95 |
| Lighthouse Buenas prácticas | ≥ 90 | ≥ 90 |
| LCP | ≤ 2,5 s | ≤ 2,0 s |
| CLS | ≤ 0,1 | ≤ 0,1 |
| axe serias/críticas | 0 | 0 |
| Contraste de texto | ≥ 4,5:1 | ≥ 4,5:1 |

## Checklist de entrega (copiar en el PR)
```
- [ ] npm run validar en verde (esquemas, contraste, licencias, tipos, pruebas)
- [ ] build de la app en verde
- [ ] recorrido principal probado en móvil y escritorio (capturas)
- [ ] acceso probado con las 4 cuentas
- [ ] Lighthouse móvil/escritorio dentro de umbral (o línea base registrada)
- [ ] LICENCIAS.md al día
- [ ] funciones con estado honesto
- [ ] mensaje para Slack listo
```
