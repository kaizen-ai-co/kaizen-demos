# Decisiones

## Tomadas (Santiago, 25/11/2026, hilo de plantillas en #todo-kaizen)

| Tema                 | Decisión                                                                                                                                                                                         | Efecto en el código                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Prioridad            | La demo de Natural Jadz con su recorrido funcionando (datos ficticios) va antes que pulir la base. «Mejor algo que funcione el viernes que algo perfecto la otra semana»                         | El orquestador prioriza recorridos sobre pulido                                            |
| Dónde corre          | Demos: Vercel + Firebase. Algo más serio: Cloudflare Pages (DNS y Access ya existen). AWS solo para producción de clientes grandes                                                               | Proveedores `memoria` y `firebase`; **no se escribe AWS** (paso 5 en pausa)                |
| Cuenta oficial       | La custodia Santiago, con cuenta de respaldo. Lo que haya que crear con ella (Firebase, Vercel) se le pide                                                                                       | Nadie más usa esa cuenta; el script de usuarios lo corre quien tenga la cuenta de servicio |
| Dominio              | Basta un subdominio tipo `demos.…`; si hace falta dominio nuevo, de los USD 30 (ideal ~USD 10)                                                                                                   | Configurable por proyecto en Vercel/Cloudflare                                             |
| Edición del cliente  | Sí, tercer rol **Cliente**, limitado a su sitio, con periodo de prueba y bloqueo automático. Editar con datos reales ya es servicio pagado (Ley 1581)                                            | Rol `cliente` con `sitioId` y `venceEl` en `acceso.ts` y reglas                            |
| Código               | Repo en `kaizen-ai-co`, `main` protegido, PR con CI en verde                                                                                                                                     | `.github/workflows/ci.yml`                                                                 |
| Plantilla 5 y Jericó | Construir con datos ficticios y el modelo de lead propio; la creación del lead detrás de la capa de datos para conectarla a Jericó cuando un cliente pague. Santiago pasará los campos de Jericó | `RepoLeads` intercambiable, `MAPEO_JERICO` en `packages/datos/src/mapeo-leads.ts`          |

## Pendientes

- [ ] Campos del lead de Jericó (Santiago) → actualizar `MAPEO_JERICO`.
- [ ] Umbrales de rendimiento y accesibilidad definitivos (Lucas) → `docs/calidad.md`.
- [ ] Proyecto de Firebase y equipo de Vercel creados con la cuenta oficial (pedir a Santiago).
- [ ] Subdominio final de las demos.
- [ ] Qué plantilla y sector van primero para cada cliente en curso.
- [ ] Servicio de producción en AWS y de identidad/datos/archivos (solo cuando haya un cliente grande).
