# Plantilla 2 · Presentación corporativa y portafolio

**Qué demuestra:** la empresa del cliente se presenta (quiénes somos, equipo, cifras) y muestra sus
casos, con un camino claro del caso al contacto.

**Recorrido que funciona:** galería de casos (filtro por sector) → detalle `/casos/<id>` →
«Quiero algo así» → formulario con el caso indicado → lead con `origen: caso-<id>` y `extra.caso`
→ vista «Leads» en `/editar`.

App: `apps/presentacion` · puerto 3002 · sitio por defecto `demo-presentacion`.

## Archivos
| Archivo | Para qué |
|---|---|
| `contenido.schema.json` | Esquema: encabezado, portada (variantes fondo/dividida/centrada), quienesSomos, equipo, cifras, casos, logos, contacto, pie |
| `lib/plantilla.ts` | `definirPlantilla()`: semilla, lead de ejemplo, estado de funciones |
| `componentes/GaleriaCasos.tsx` | Bloque cliente: filtro por sector y tarjetas que enlazan al detalle |
| `componentes/ContactoCaso.tsx` + `FormularioCaso.tsx` | Contacto que lee `?caso=<id>` (o `#contacto?caso=<id>`), valida que el caso exista y lo envía en el lead |
| `componentes/bloques.ts` | `BLOQUES` comunes + `casos` y `contacto` propios |
| `app/casos/[slug]/page.tsx` | Detalle generado desde el contenido (no hay una página por caso escrita a mano); 404 si no existe |
| `semillas/presentacion/` | `contenido.json` base, `sectores/constructora.json`, `leads.json` |
| `public/semillas/*.svg` | Ilustraciones propias (CC0) |

## Qué edita cada rol en `/editar`
| Campo | Administrador / Cliente | Desarrollador |
|---|---|---|
| Textos, imágenes, cifras, logos, contacto | Sí | Sí |
| Casos: agregar, quitar, reordenar (arrastrar), id, sector, resultado | Sí | Sí |
| Equipo: agregar, quitar, reordenar (arrastrar) | Sí | Sí |
| Variante de portada, orden y visibilidad de secciones, colores | No | Sí (pestaña «Estructura») |

El `id` del caso es el slug de su URL: no lo cambies después de publicar o el enlace viejo da 404.

## Cómo probar (paso 8)
1. `npm run dev:presentacion` con `DATOS_PROVEEDOR=memoria` y `ENTRAR_COMO_PRUEBA=1`.
2. `/editar` → Administrador → «Galería de casos» → Agregar caso (id `caso-nuevo`, sector, imagen con texto alternativo, resumen, resultado) → Publicar.
3. `/` muestra el caso en la galería y en su filtro; `/casos/caso-nuevo` muestra el detalle.
4. «Quiero algo así» → el formulario indica el caso → enviar → aparece en «Leads» con `extra.caso`.
5. Repetir en 375 px y 1280 px.

Verificado el 26/11 con `next start` (memoria): `/` 200, `/casos/red-clinicas` 200, `/casos/nada` 404, lead con caso creado (201).

## Estado
- Disponible: galería con filtro, detalle generado, caso → formulario → lead, edición y reordenamiento de casos y equipo.
- Pendiente: versión en inglés.
