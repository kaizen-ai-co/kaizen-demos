# Plantilla 5 · Panel de administración y CRM

**Qué demuestra:** el recorrido completo de *formulario móvil → lead asignado en el CRM → seguimiento
hasta cerrarse*. Es la demo que Duván y Lucas usan para mostrar «del WhatsApp/formulario al lead asignado».

- App: `apps/panel` (puerto 3005) · Sitio por defecto: `demo-panel`
- Semillas: `semillas/panel/` (base, sector `inmobiliaria`, `leads.json`)

## Recorrido
1. El visitante abre `/` en el celular y llena el formulario (campos editables).
2. `POST /api/leads` (base común: campo trampa, límite por IP, limpieza) llama al gancho
   `antesDeCrearLead` → `asignarAlCrear()` (`lib/crm.ts`): pone la primera etapa y elige responsable
   con `asignarResponsable` de `@kaizen/modulos/asignacion`. El puntero de turnos se guarda en la
   capa de datos (`sitios/{sitio}/sistema/asignacion`).
3. El lead se crea con `capa.leads.crear` (historial: `creado`, `responsable`).
4. El equipo entra a `/panel` (Google; sin sesión redirige a `/editar`):
   - `/panel` resumen: totales, abiertos, sin asignar, barras por etapa y por responsable.
   - `/panel/leads` lista con filtros (etapa, responsable, texto) por GET (funciona sin JS).
   - `/panel/leads/[id]` detalle con historial fechado; cambiar etapa/responsable y agregar nota
     (`PATCH /api/leads/[id]`).
   - `/panel/tablero` kanban por etapas con arrastrar y soltar (@dnd-kit: mouse, táctil y teclado,
     más un selector por tarjeta como alternativa accesible). Cada movimiento hace PATCH y queda en
     el historial.
5. «Cargar datos de ejemplo» (`POST /api/ejemplos`, protegido) crea los leads de /editar → «Datos de
   ejemplo», pasando por la misma regla de asignación.

## Archivos
| Archivo | Para qué |
|---|---|
| `contenido.schema.json` | Formulario, etapas, responsables, textos, ejemplos, asignación (Dev) |
| `lib/plantilla.ts` | `definirPlantilla` + gancho de asignación + siembra + estado honesto |
| `lib/crm.ts` | Lógica pura: etapas, responsables, regla, `asignarAlCrear`, métricas |
| `lib/crm.test.ts` | Pruebas Vitest con la capa en memoria |
| `lib/proteger.ts` | Guardia de las pantallas `/panel/*` (acceso + permiso `leads:leer`) |
| `app/page.tsx` | Formulario móvil público |
| `app/panel/**` | Resumen, lista, detalle, tablero |
| `app/api/ejemplos/route.ts` | Carga de datos de ejemplo |

## Campos por rol
| Sección | Administrador / Cliente | Solo Desarrollador |
|---|---|---|
| Formulario móvil (textos y campos) | ✔ | |
| Etapas (nombre, tono, cierre) | ✔ | |
| Responsables (ficticios, activo) | ✔ | |
| Textos del panel | ✔ | |
| Datos de ejemplo | ✔ | |
| Regla de asignación (modo, reglas por origen) | | ✔ |

Los responsables son personas ficticias del contenido, **no** cuentas de Google.
El tono de cada etapa se elige entre tokens del tema (primario, acento, éxito, aviso, peligro, neutro).

## Conexión futura con Jericó
La creación del lead pasa solo por la capa de datos. Cuando un cliente pague, se implementa un
`RepoLeads` que escriba en el CRM de Jericó con `leadADestino(lead, MAPEO_JERICO)`
(`packages/datos/src/mapeo-leads.ts`) y se registra con `registrarSustituto('leads', repo)` en
`instrumentation.ts`. Esta app no cambia. `MAPEO_JERICO` queda igual a los nombres propios hasta que
Santiago comparta los campos de Jericó.

## Cómo probar
```bash
# .env.local en apps/panel: DATOS_PROVEEDOR=memoria y ENTRAR_COMO_PRUEBA=1
npm run dev:panel
npx vitest run apps/panel
```
1. Abrir `/` a 375 px, enviar el formulario → mensaje de éxito.
2. `/editar` → cuenta Administrador → `/panel`: el lead aparece asignado (turnos: Ana, Bruno, Ana…).
3. Moverlo de etapa en `/panel/tablero` → en su detalle aparece «Etapa: Nuevo → Contactado» con fecha.
4. Con Administrador, la sección «Regla de asignación» no aparece en /editar; con Desarrollador sí.
5. Sin sesión, `/panel` redirige a `/editar`; la cuenta no autorizada recibe 403 en las API.

## Estado
| Función | Estado |
|---|---|
| Formulario móvil a lead | Disponible |
| Asignación automática (turnos, origen, carga, manual) | Disponible |
| Tablero con arrastrar y soltar + historial | Disponible |
| Métricas por etapa y responsable | Disponible |
| Conexión con el CRM de Jericó | Pendiente |
| Avisos por WhatsApp al responsable | Pendiente |
