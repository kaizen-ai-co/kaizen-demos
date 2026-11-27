# Plantilla 4 · Visor 3D de objetos

**Qué demuestra:** el visitante ve un objeto en 3D, lo gira, lo personaliza (colores y materiales
por parte) y pide la configuración que armó. El pedido llega como lead con las opciones elegidas.

**App:** `apps/visor3d` · puerto 3004 · sitio por defecto `demo-visor3d` · agente líder: `especialista-3d`.

## Recorrido que funciona
1. Página pública `/`: visor 3D (carga diferida) + configurador.
2. El visitante elige una opción por parte → el material cambia en vivo.
3. «Solicitar esta configuración» → `FormularioLead` con `origen: "visor3d"` y
   `extra: { producto, configuracion: { parteId: opcionId }, resumen }`.
4. `/editar` → pestaña «Configuraciones pedidas» muestra el lead con su `extra`.

## Archivos
| Archivo | Qué hace |
|---|---|
| `contenido.schema.json` | Esquema: encabezado, portada, modelo, cámara, partes, ayuda, solicitud, escena (Dev), pie |
| `lib/plantilla.ts` | `definirPlantilla()` + leads de ejemplo + estado honesto |
| `lib/tipos.ts` | Tipos y funciones puras: normalizar vista/escena/partes, selección, resumen |
| `componentes/Visor.tsx` | Canvas R3F: `dpr [1,1.75]`, `frameloop="demand"`, OrbitControls, ContactShadows, Environment, carga con `useProgress`, reiniciar vista, reserva sin WebGL, carga de `.glb` con `useGLTF` (Draco) |
| `componentes/SillaProcedural.tsx` | Objeto de demostración propio (CC0) con mallas `asiento`, `respaldo`, `patas` |
| `componentes/Configurador.tsx` | Visor con `next/dynamic` (`ssr: false`), selector de opciones (radiogroup accesible), formulario |
| `app/editar/EditorVisor.tsx` | Registra el control propio `vistaCamara` («Guardar vista») y envuelve `<Editor>` |
| `semillas/visor3d/` | Base, sector `muebles` y lead de ejemplo |
| `LICENCIAS-RECURSOS.md` | Recursos de esta plantilla (pendiente de copiar a `LICENCIAS.md`) |

## Campos por rol
| Sección | Administrador / Cliente | Solo Desarrollador |
|---|---|---|
| Encabezado, presentación, pie | Textos | — |
| Modelo 3D | Nombre, descripción, subir `.glb` (≤ 15 MB), imagen de reserva | — |
| Cámara inicial | «Guardar vista» desde el mini visor | — |
| Partes | Partes, malla, opciones (color, rugosidad, metalicidad) | — |
| Ayuda, solicitud | Textos, botón, mensaje de confirmación | — |
| Escena | — | Intensidad de luz, entorno, color de fondo |

**Cómo se conecta una parte con el modelo:** el campo «Malla» se compara con `mesh.name` y con
`material.name` del `.glb`. Al subir un modelo nuevo, escribe en «Malla» los nombres que trae
(ábrelo en https://gltf-viewer.donmccurdy.com para verlos).

## Cómo probar (paso 8)
```bash
# .env.local: DATOS_PROVEEDOR=memoria, ENTRAR_COMO_PRUEBA=1
npm run dev:visor3d   # http://localhost:3004
```
1. Cambia el color del asiento → se ve al instante.
2. Llena el formulario con datos ficticios → «Recibido».
3. `/editar` (Administrador) → «Configuraciones pedidas» muestra `configuracion` y `resumen`.
4. `/editar` → Cámara inicial → gira el mini visor → «Guardar vista» → Publicar → la página abre con esa vista.
5. Sube un `.glb` CC0 en «Modelo 3D» → Publicar → se ve en la página.
6. Desarrollador: «Escena» visible; Administrador: no aparece.

Verificado el 26/11 (memoria): `tsc` y `next build` en verde; `/api/salud` ok; POST de lead con
`extra.configuracion` guardado; vista «Configuraciones pedidas (2)» en `/editar`.

## Rendimiento
- three.js no entra en la carga inicial (First Load JS de `/` ≈ 120 kB); el visor se descarga al montarse.
- `frameloop="demand"`: no dibuja si nada cambia (ahorra batería en móvil).
- Sombras de contacto de un solo cuadro (`frames={1}`), sin sombras dinámicas ni postprocesado.
- Entorno por defecto `local` (luces en código, sin descargas). Los presets `studio/city/apartment/sunset`
  descargan un HDR CC0 desde el CDN de drei: úsalos solo si hay buena conexión.
- Modelos: GLB comprimido, objetivo < 3 MB
  (`npx @gltf-transform/cli optimize in.glb out.glb --compress draco --texture-compress webp`).
- Pendiente: medir fps en un móvil de gama media (objetivo ≥ 30 fps al girar) y Lighthouse.

## Estado honesto
- **Disponible:** visor, configurador en vivo, solicitud con configuración, subir `.glb`, guardar cámara.
- **Prototipo:** el objeto por defecto es una silla procedural, no un producto real.
- **Pendiente:** precio según configuración, realidad aumentada.
