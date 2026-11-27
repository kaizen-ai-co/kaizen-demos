import { ErrorEntrada, json, manejar } from '@kaizen/nucleo/servidor';
import { ErrorAgenda, huecosDisponibles } from '@/lib/agenda';
import { plantilla } from '@/lib/plantilla';

export const dynamic = 'force-dynamic';

/** GET público: ?servicio=<id>&profesional=<id|cualquiera>&fecha=AAAA-MM-DD → huecos libres (hora de Bogotá). */
export const GET = manejar(async (req: Request) => {
  const q = new URL(req.url).searchParams;
  const servicioId = q.get('servicio') ?? '';
  const profesionalId = q.get('profesional') || 'cualquiera';
  const fecha = q.get('fecha') ?? '';
  const { datos, sitioId } = await plantilla.obtenerContenido();
  try {
    const huecos = await huecosDisponibles(await plantilla.capa(), sitioId, datos, {
      servicioId,
      profesionalId,
      fecha,
    });
    return json({ huecos });
  } catch (e) {
    if (e instanceof ErrorAgenda) throw new ErrorEntrada(e.message, 422);
    throw e;
  }
});
