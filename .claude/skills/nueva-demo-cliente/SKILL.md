---
name: nueva-demo-cliente
description: Arma la demo web de un cliente sobre una plantilla existente, con su sector y su problema en sus palabras, datos ficticios y vista previa lista para que Duván la muestre. Úsala con pedidos como "demo para la clínica X", "arma la demo de Natural Jadz" o "prepara la demo para la reunión del sábado".
argument-hint: <cliente o sitio> [plantilla] [sector]
---

# Demo para un cliente

Pedido: **$ARGUMENTS**

## 1. Entender al cliente (sin datos personales)
Busca el contexto en el hilo del cliente en Slack (#operacion-clientes), el acta de Meet o las notas de Duván:
problema en sus palabras, frecuencia y costo del problema, quién decide, el recorrido que más le importa ver
y la fecha de la reunión. Si falta algo esencial, pregúntalo en una sola pregunta.

## 2. Elegir plantilla y sector
Usa la tabla de `docs/flujo-demo-cliente.md`. Si ningún sector existente sirve, `redactor-demos` crea
`semillas/<plantilla>/sectores/<sector>.json` (reutilizable para el próximo cliente del mismo sector).
Si el recorrido exige una pieza que ninguna plantilla tiene, márcala como **desarrollo pendiente** y avisa:
esa pieza la revisa Lucas antes de entrar al catálogo.

## 3. Crear y llenar
```bash
npm run nueva-demo -- --plantilla <p> --sitio <id-del-sitio> --sector <s>
```
- `redactor-demos`: contenido en palabras del cliente en `semillas/<p>/demos/<id>.json` (solo lo que cambia).
- `disenador-ui`: colores del cliente en `_estructura.tema.colores` y variantes para que no se vea igual a la anterior.
- Datos ficticios realistas del sector (leads, productos, citas…). Nunca datos reales del cliente.

## 4. Probar
```bash
npm run validar:esquemas -- <p>
SITIO_ID=<id> SECTOR=<s> DATOS_PROVEEDOR=memoria ENTRAR_COMO_PRUEBA=1 npm run dev:<p>
```
`ingeniero-pruebas` recorre el flujo principal en móvil y escritorio y toma capturas.

## 5. Publicar vista previa
`ingeniero-despliegue`: rama `demo/<id>`, variables `SITIO_ID`, `SECTOR`, `DATOS_PROVEEDOR=firebase` → URL de vista previa.

## 6. Entregar
- Estado honesto visible en la demo (qué es disponible, prototipo, pendiente).
- Guion corto para Duván (3–5 pasos del recorrido con qué decir en cada uno).
- `/registro-slack` en el hilo del cliente.
