# Flujo: demo para un cliente

El agente elige la plantilla, redacta el contenido en palabras del cliente y publica una vista previa.
Solo se programa cuando falta una pieza nueva, y esa pieza la revisa Lucas antes de entrar al catálogo.

## 1. Diagnóstico (entrada de Duván)

Del diagnóstico o del acta de Meet se toma: problema en palabras del cliente, frecuencia, costo, quién decide,
canales que usa y el recorrido que más le importa ver. Sin datos personales.

## 2. Elegir plantilla

| El cliente necesita ver…                               | Plantilla        |
| ------------------------------------------------------ | ---------------- |
| Que un visitante deja sus datos y llega como lead      | 1 · comercial    |
| Su empresa presentada con casos                        | 2 · presentación |
| Elegir productos y recibir una cotización              | 3 · catálogo     |
| Un objeto en 3D personalizable                         | 4 · visor 3D     |
| Del formulario móvil al lead asignado y su seguimiento | 5 · panel CRM    |
| Reservar una cita y verla en el calendario             | 6 · agenda       |

## 3. Crear la demo

```bash
npm run nueva-demo -- --plantilla comercial --sitio cliente-ejemplo --sector clinica
```

Crea `semillas/<plantilla>/demos/<sitio>.json`, la registra y deja las variables para Vercel.
`redactor-demos` llena el contenido; `disenador-ui` aplica colores y variantes.

## 4. Vista previa y revisión

Rama `demo/<sitio>` → vista previa de Vercel → `ingeniero-pruebas` corre el recorrido → `auditor-calidad`.
Lucas aprueba (una sola aprobación humana) y se comparte el enlace con Duván.

## 5. Registro

`cronista-slack` deja el mensaje en el hilo del cliente en #operacion-clientes.

## 6. Si el cliente quiere editar

Alta como rol **Cliente** con periodo de prueba (`npm run usuario -- --rol cliente --sitio <id> --dias 14`).
Con datos reales solo cuando ya es servicio pagado.
