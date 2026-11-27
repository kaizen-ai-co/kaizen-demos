# Plantilla 1 · Sitio comercial de servicios

**Qué demuestra:** un visitante deja sus datos y llega como lead.
**Recorrido:** página pública → formulario → `sitios/{sitioId}/leads` (estado `nuevo`) → pestaña «Leads» en `/editar`.

## Archivos

| Archivo                                | Qué es                                                                                                                                                                  |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/comercial/contenido.schema.json` | Esquema: encabezado, portada (3 variantes), problema, servicios, cómo trabajamos, testimonios, precios (3 variantes), preguntas, contacto con campos configurables, pie |
| `apps/comercial/lib/plantilla.ts`      | `definirPlantilla()` + leads de ejemplo + estado honesto                                                                                                                |
| `apps/comercial/app/page.tsx`          | Página pública con `RenderizadorSecciones`                                                                                                                              |
| `apps/comercial/app/editar/page.tsx`   | Editor + vista Leads                                                                                                                                                    |
| `semillas/comercial/`                  | `contenido.json`, `leads.json`, `sectores/clinica.json`, `demos/`                                                                                                       |

## Campos por rol

| Administrador / Cliente                                                                                                       | Solo Desarrollador                                                                         |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Textos de todas las secciones, servicios, planes y precios, testimonios, preguntas, campos del formulario, contacto, imágenes | Moneda, orden y visibilidad de secciones, variantes de portada y precios, colores del tema |

## Protección del formulario

Campo trampa `_trampa` (se descarta en silencio), límite de envíos por IP (`LIMITE_ENVIOS_POR_HORA`),
validación de nombre y de al menos un medio de contacto en cliente y servidor, textos limpiados y acotados.

## Cómo probar (paso 8)

```bash
DATOS_PROVEEDOR=memoria ENTRAR_COMO_PRUEBA=1 npm run dev:comercial
```

1. En el móvil (o 375 px) enviar el formulario con datos ficticios.
2. `/editar` → Administrador → pestaña «Leads»: aparece con nombre, contacto, fecha y estado.
3. Cambiar un texto → ver la vista previa → Publicar → la página pública cambia → Volver atrás.

## Estado

| Función                                     | Estado               |
| ------------------------------------------- | -------------------- |
| Formulario a lead                           | Disponible           |
| Vista de leads                              | Disponible           |
| Edición sin código, publicar y volver atrás | Disponible           |
| Notificación al equipo por WhatsApp         | Desarrollo pendiente |

Verificado el 26/11/2026: build de producción OK; lead público creado; campo trampa descartado; 401 sin sesión;
403 cuenta no autorizada; un Administrador no puede cambiar `_estructura` ni la moneda; publicar con título vacío → 422;
volver atrás restaura la versión anterior; el borrador no se ve sin sesión.
