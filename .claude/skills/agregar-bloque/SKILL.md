---
name: agregar-bloque
description: Agrega una sección o bloque nuevo (o una variante) a una plantilla de forma editable desde /editar, conectando bloque, esquema, semilla y pruebas. Úsala con pedidos como "agrega una sección de aliados", "quiero una tercera variante de portada" o "añade un mapa al contacto".
argument-hint: <plantilla> <nombre del bloque o variante>
---

# Agregar un bloque editable

Pedido: **$ARGUMENTS**

Un bloque solo está terminado cuando las **cuatro piezas** coinciden: componente, registro, esquema y semilla.

## 1. Componente

- ¿Lo usarán 2+ plantillas? → `packages/ui/src/bloques/comunes.tsx`. Si no → `apps/<p>/componentes/`.
- Firma: `function MiBloque({ id, datos, variante, contexto }: PropsBloque)`.
- Documenta en un comentario los campos que lee: `/** Campos: titulo, items[{nombre, imagen}] */`.
- Solo tokens del tema, móvil primero, `<Aparecer>` para animación, `alt` en imágenes.
- Variante nueva de un bloque existente: agrega una rama `if (variante === 'nueva')` y súmala a `variantes`.

## 2. Registro

- Compartido: agrégalo a `BLOQUES` en `packages/ui/src/bloques/index.tsx` con el id de la sección.
- Propio: `<RenderizadorSecciones bloques={{ ...BLOQUES, miSeccion: MiBloque }} />` en la página de la app.

## 3. Esquema

En `apps/<p>/contenido.schema.json`, sección con el mismo `id`, `activable: true` si es opcional, campos con
`max`, `requerido` y `rol` donde aplique. Lo que es diseño o regla → `"rol": "desarrollador"`.

## 4. Semilla

Valores ficticios en `semillas/<p>/contenido.json` y agrega el id a `_estructura.orden`.

## 5. Verificar

```bash
npm run validar:esquemas -- <p>
npm run typecheck && npm run build -w @kaizen/app-<p>
```

En `/editar`: el bloque aparece, se edita, se ve en la vista previa, se oculta/reordena (Dev) y se publica.
