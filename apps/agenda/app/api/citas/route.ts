import { crearLimitador } from '@kaizen/modulos/limite';
import { ErrorEntrada, ipDe, json, leerJson, limpiar, manejar } from '@kaizen/nucleo/servidor';
import { ErrorAgenda, reservarCita } from '@/lib/agenda';
import { plantilla } from '@/lib/plantilla';

export const dynamic = 'force-dynamic';
const limitador = crearLimitador();

/**
 * POST público: reserva. Campo trampa + límite por IP; el servidor recalcula que el hueco sea
 * válido y la capa de datos lo guarda en una sola operación. Ocupado → 409 con alternativas.
 */
export const POST = manejar(async (req: Request) => {
  const c = await leerJson<Record<string, unknown>>(req, 10_000);
  if (limpiar(c._trampa)) return json({ ok: true, id: 'descartado' });
  const permitido = limitador.permitir(`cita:${ipDe(req)}`);
  if (!permitido.ok) throw new ErrorEntrada('Demasiadas reservas desde este dispositivo. Intenta más tarde.', 429);

  const nombre = limpiar(c.nombre, 120);
  const telefono = limpiar(c.telefono, 30);
  const correo = limpiar(c.correo, 160).toLowerCase();
  if (!nombre) throw new ErrorEntrada('Escribe tu nombre.', 422);
  if (!telefono && !correo) throw new ErrorEntrada('Deja un teléfono o un correo.', 422);
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) throw new ErrorEntrada('Revisa el correo.', 422);
  if (telefono && !/^[+()\d\s-]{7,20}$/.test(telefono)) throw new ErrorEntrada('Revisa el teléfono.', 422);

  const { datos, sitioId } = await plantilla.obtenerContenido();
  try {
    const r = await reservarCita(await plantilla.capa(), sitioId, datos, {
      servicioId: limpiar(c.servicioId, 60),
      profesionalId: limpiar(c.profesionalId, 60),
      inicio: limpiar(c.inicio, 40),
      visitante: { nombre, telefono: telefono || undefined, correo: correo || undefined },
    });
    if (!r.ok) {
      return json(
        {
          error: r.motivo === 'ocupado' ? 'Ese horario se acaba de ocupar.' : 'Ese horario no está disponible.',
          motivo: r.motivo,
          alternativas: r.alternativas,
        },
        409,
      );
    }
    return json({ ok: true, id: r.cita.id, inicio: r.cita.inicio, fin: r.cita.fin }, 201);
  } catch (e) {
    if (e instanceof ErrorAgenda) throw new ErrorEntrada(e.message, 422);
    throw e;
  }
});

/** GET protegido: ?desde=ISO&hasta=ISO[&profesional=id] */
export const GET = manejar(async (req: Request) => {
  await plantilla.exigir('citas:gestionar');
  const q = new URL(req.url).searchParams;
  const desde = q.get('desde');
  const hasta = q.get('hasta');
  if (!desde || !hasta || Number.isNaN(Date.parse(desde)) || Number.isNaN(Date.parse(hasta)))
    throw new ErrorEntrada('Indica desde y hasta en ISO 8601.');
  const citas = await (
    await plantilla.capa()
  ).citas.listarRango(plantilla.sitioId(), desde, hasta, q.get('profesional') ?? undefined);
  return json(citas);
});
