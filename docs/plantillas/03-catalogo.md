# Plantilla 3 · Catálogo y cotización

**Qué demuestra:** el visitante elige productos y cantidades y recibe una cotización en pantalla y
en PDF, con precios, impuesto y condiciones editables.

**Recorrido que funciona:** catálogo (filtro por categoría + búsqueda) → detalle `/productos/<id>` →
«Agregar a la cotización» → `/cotizacion` (cantidades, totales, datos) → cotización guardada con
número consecutivo → PDF → vista «Cotizaciones» en `/editar`.

App: `apps/catalogo` · puerto 3003 · sitio por defecto `demo-catalogo`.

## Un solo cálculo de totales

`calcularTotales` (`packages/modulos/src/totales.ts`) es la única fórmula. La envuelve
`totalesDe` en `lib/cotizacion.ts` y la usan:

- la pantalla «Mi cotización» (vista previa en el navegador),
- la API `POST /api/cotizaciones`, que **ignora los precios del navegador** y arma la cotización
  con los precios y condiciones del contenido **publicado** (`armarCotizacion`),
- el PDF (`lib/pdf.ts`), que recalcula desde los ítems guardados.

## Archivos

| Archivo                                                   | Para qué                                                                                                       |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `contenido.schema.json`                                   | encabezado, portada, catalogo (categorías + productos), condiciones, cotizacion, pie                           |
| `lib/cotizacion.ts`                                       | `leerCatalogo`, `armarCotizacion` (valida productos, disponibilidad, cantidades, junta repetidos), `totalesDe` |
| `lib/cotizacion.test.ts`                                  | 3 productos: totales del servidor = `calcularTotales`; precios del navegador ignorados; PDF válido             |
| `lib/pdf.ts`                                              | PDF A4 con pdf-lib (MIT), sin servicios externos: corre igual en Vercel, Cloudflare o AWS                      |
| `app/api/cotizaciones/route.ts`                           | POST público (campo trampa, límite por IP, validación) · GET protegido (`cotizaciones:leer`)                   |
| `app/api/cotizaciones/[id]/pdf/route.ts`                  | Descarga del PDF                                                                                               |
| `componentes/carrito.ts`                                  | Carrito en `localStorage` (solo ids y cantidades, con try/catch)                                               |
| `componentes/Interactivos.tsx`                            | Catálogo con filtros, botón agregar, enlace con contador                                                       |
| `componentes/MiCotizacion.tsx`                            | Líneas, cantidades, totales, formulario y resultado con PDF                                                    |
| `componentes/VistasEditor.tsx`                            | Vistas «Cotizaciones» e «Importar CSV» del editor                                                              |
| `semillas-csv/productos-ejemplo.csv` (copia en `public/`) | Formato de importación                                                                                         |
| `semillas/catalogo/`                                      | `contenido.json` base y `sectores/ferreteria.json`                                                             |

## Qué edita cada rol en `/editar`

| Campo                                                                                    | Administrador / Cliente | Desarrollador |
| ---------------------------------------------------------------------------------------- | ----------------------- | ------------- |
| Productos (nombre, foto, descripción, precio, unidad, categoría, disponible), categorías | Sí                      | Sí            |
| Validez, entrega, texto al pie de la cotización, textos de pantalla                      | Sí                      | Sí            |
| Moneda, nombre del impuesto, **tasa de impuesto**, **descuento general**                 | No                      | Sí            |
| Ver cotizaciones recibidas                                                               | Sí                      | Sí            |

La categoría de un producto se elige de la lista de categorías (`opcionesDesde`), sin reescribirla.

## Cómo probar (paso 8)

1. `npm run dev:catalogo` con `DATOS_PROVEEDOR=memoria` y `ENTRAR_COMO_PRUEBA=1`.
2. Agregar 3 productos → `/cotizacion` → ajustar cantidades → datos ficticios → «Recibir mi cotización».
3. Comparar el total de pantalla con el del PDF («Descargar PDF»).
4. `/editar` → «Cotizaciones»: aparece con el mismo total.
5. `npx vitest run apps/catalogo` (5 pruebas).

Verificado el 26/11 con `next start` (memoria): 3 productos (4 resmas, 2 jabones, 3 cafés) → total
$ 255.850 en API y PDF; el `precioUnitario: 1` enviado por el navegador se ignoró; `GET /api/cotizaciones` sin sesión → 401.

## Estado

- Disponible: catálogo con filtros y búsqueda, Mi cotización con totales, cotización guardada y visible en el editor.
- Prototipo: **PDF** (quien tenga el id de la cotización puede descargarla sin sesión; en un servicio
  real se firma el enlace o se exige sesión) e **importación CSV** (solo formato y archivo de ejemplo;
  la carga directa a la tabla de productos falta).
- Pendiente: envío de la cotización por correo.
