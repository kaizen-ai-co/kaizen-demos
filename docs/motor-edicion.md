# Motor de edición

Cada plantilla se edita en `/editar` con la misma interfaz y un formulario generado desde su
`contenido.schema.json`.

## Flujo
```
/editar ─► sin sesión: «Entrar con Google»   ─► no autorizada / vencida / otro sitio: «Sin acceso»
        └► autorizada: Editor
             • panel izquierdo: Contenido | Estructura (solo Dev) | vistas extra (Leads, Cotizaciones…)
             • panel derecho: vista previa en vivo del borrador (móvil 390 px / escritorio)
             • cada cambio → PUT /api/editor/borrador (espera 800 ms) → recarga la vista previa
             • Publicar → valida en cliente y en servidor → copia borrador a publicado, archiva el anterior,
               registra quién y cuándo
             • Volver atrás → restaura la publicación anterior con un clic (la actual queda en el historial)
```

## Almacenamiento
`sitios/{sitioId}/contenido/{borrador|publicado|v_<ms>_<id>}` con `estado`, `datos`, `actualizadoPor`,
`publicadoPor`, `publicadoEl`. Imágenes y modelos 3D en el almacenamiento de archivos
(`sitios/{sitioId}/publico/{imagenes|modelos}/…`); en el contenido se guarda `{ ruta, url, alt, bytes }`.

## Formato del esquema (resumen)
```jsonc
{
  "$schema": "../../packages/editor/esquema.meta.json",   // autocompletado en el IDE
  "plantilla": "comercial", "version": 1, "titulo": "Sitio comercial",
  "vistas": [{ "id": "leads", "titulo": "Leads" }],
  "secciones": [{
    "id": "precios", "titulo": "Precios",
    "activable": true,                          // el Dev puede ocultarla
    "variantes": ["tarjetas", "destacado", "tabla"],
    "rol": "desarrollador",                     // (opcional) toda la sección solo Dev
    "campos": [
      { "id": "titulo", "etiqueta": "Título", "tipo": "texto", "requerido": true, "max": 60 },
      { "id": "moneda", "etiqueta": "Moneda", "tipo": "seleccion", "opciones": ["COP","USD"], "rol": "desarrollador" },
      { "id": "planes", "etiqueta": "Planes", "tipo": "lista", "minItems": 1, "maxItems": 4, "campoTitulo": "nombre",
        "campos": [ { "id": "nombre", "etiqueta": "Nombre", "tipo": "texto", "requerido": true } ] }
    ]
  }]
}
```
Tipos base: `texto, textoLargo, numero, precio, porcentaje, booleano, imagen, modelo3d, color, seleccion,
multiseleccion, enlace, correo, telefono, icono, fecha, hora, lista, grupo`. Opciones desde el propio
contenido: `"props": { "opcionesDesde": "equipo.responsables.nombre" }`.

Estructura (solo Dev) en `_estructura`: `orden`, `ocultas`, `variantes`, `tema.colores`.

## Validación
`validarContenido()` revisa obligatorios, largos, rangos, formatos (correo, teléfono, enlace, color),
tamaño y formato de archivos, **texto alternativo de imágenes** y listas. Las secciones ocultas no bloquean.
El editor marca errores por sección y bloquea «Publicar»; el servidor vuelve a validar.

## Protección por rol
- `filtrarPorRol(esquema, rol)` → lo que ve cada rol.
- `fusionarSeguro(esquema, rol, antes, despues)` → el servidor restaura cualquier campo reservado que un
  Administrador o Cliente intente cambiar (incluido `_estructura`), aunque manipule la petición.
- `cambiosProhibidos()` → lista de rutas cambiadas sin permiso (útil en pruebas y auditoría).

## Extender
| Necesito… | Hago… |
|---|---|
| Un control propio (horario, cámara 3D) | `registrarControl('tipo', Componente)` en un archivo `'use client'` de la app y `<PaginaEditar editor={EditorApp} />` |
| Validar ese tipo | `registrarValidador('tipo', fn)` y sumarlo a `TIPOS_PROPIOS` en `scripts/validar-esquemas.ts` |
| Una pestaña de solo lectura | `vistas={async (usuario) => [{ id, titulo, contenido: <JSX/> }]}` en `PaginaEditar` |
| Un bloque nuevo | skill `/agregar-bloque` |

## Aviso
El editor y las páginas públicas muestran siempre «Demo con datos ficticios» y no admiten datos personales reales.
