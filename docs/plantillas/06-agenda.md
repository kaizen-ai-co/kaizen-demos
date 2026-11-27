# Plantilla 6 · Agendamiento de citas

**Qué demuestra:** el visitante reserva una cita y el equipo la ve en un calendario, **sin que se
crucen dos reservas**.

- App: `apps/agenda` (puerto 3006) · Sitio por defecto: `demo-agenda`
- Semillas: `semillas/agenda/` (base, sector `clinica-estetica`, `citas.json` relativas a hoy)
- Zona horaria fija: **America/Bogota** (cálculo en `@kaizen/modulos/huecos`, independiente del servidor)

## Recorrido
1. `/` flujo en 4 pasos: **servicio → profesional (o «cualquiera») → día y hora → datos**.
2. Cada día consulta `GET /api/huecos?servicio=&profesional=&fecha=` (público): huecos según
   duración, horario semanal, excepciones, citas ya reservadas y reglas.
3. Al confirmar, `POST /api/citas` (campo trampa + límite por IP):
   - el servidor **recalcula** que el hueco esté entre los válidos (`reservarCita` en `lib/agenda.ts`);
   - guarda con `capa.citas.reservar`, que verifica y escribe **en una sola operación**
     (memoria: atómica; Firebase: transacción con candado por profesional y día);
   - si el hueco ya se ocupó → **409** con huecos alternativos, que el flujo ofrece de inmediato.
4. Confirmación en pantalla. **No se envían correos ni mensajes** (no se contacta a personas reales).
5. El equipo ve `/calendario` (protegido): semana con citas por día, filtro por profesional y cambio
   de estado pendiente / confirmada / cancelada (`PATCH /api/citas/[id]`). Cancelar libera el hueco.

## Archivos
| Archivo | Para qué |
|---|---|
| `contenido.schema.json` | Servicios, profesionales + horario, excepciones, mensajes, reglas (Dev) |
| `lib/agenda.ts` | Lectura del contenido, `huecosDisponibles`, `reservarCita`, `lunesDe` |
| `lib/agenda.test.ts` | Pruebas: reservar quita el hueco, doble reserva = `ocupado`, festivos |
| `lib/plantilla.ts` | `definirPlantilla` + siembra de citas relativas a hoy + estado honesto |
| `app/Reserva.tsx` | Flujo de 4 pasos (cliente) |
| `app/api/huecos`, `app/api/citas`, `app/api/citas/[id]` | API propias |
| `app/calendario/**` | Calendario semanal y cambio de estado |
| `app/editar/EditorAgenda.tsx` | `<Editor>` + control propio `horarioSemanal` |

## Campos por rol
| Sección | Administrador / Cliente | Solo Desarrollador |
|---|---|---|
| Encabezado | ✔ | |
| Servicios (nombre, duración, precio ficticio) | ✔ | |
| Profesionales (nombre, foto, servicios, **horario por día**) | ✔ | |
| Festivos y ausencias | ✔ | |
| Mensajes de la reserva | ✔ | |
| Reglas de huecos (intervalo, colchón, anticipación, días) y política de cancelación | | ✔ |

### Control `horarioSemanal`
Valor: `{ lunes: [{ inicio: "08:00", fin: "12:00" }], … }`. Selector por día («Atiende»), varias
franjas por día, aviso si inicio ≥ fin. Registrado en `EditorAgenda.tsx` con `registrarControl`.

## Cómo probar
```bash
# .env.local en apps/agenda: DATOS_PROVEEDOR=memoria y ENTRAR_COMO_PRUEBA=1
npm run dev:agenda
npx vitest run apps/agenda
```
1. A 375 px reservar «Valoración inicial» con Laura el próximo martes 9:00 → confirmación.
2. Volver a elegir el mismo día: las 9:00 ya no aparecen.
3. `/editar` → Administrador → `/calendario`: la cita aparece como *pendiente*; cambiarla a *confirmada*.
4. Cambiar el horario del martes en /editar y publicar → los huecos públicos cambian.
5. Sin sesión, `/calendario` redirige a `/editar` y `GET /api/citas` responde 401.

## Estado
| Función | Estado |
|---|---|
| Reserva en 4 pasos | Disponible |
| Huecos por horario, excepciones y citas (America/Bogota) | Disponible |
| Bloqueo de doble reserva | Disponible |
| Calendario semanal con estados | Disponible |
| Confirmación en pantalla | Disponible |
| Recordatorios por correo o WhatsApp | Pendiente |
| Pago anticipado | Pendiente |
