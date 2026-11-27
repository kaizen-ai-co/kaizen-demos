import type { EstadoCita } from '@kaizen/datos';
import { ErrorEntrada, json, leerJson, manejar } from '@kaizen/nucleo/servidor';
import { plantilla } from '@/lib/plantilla';

const ESTADOS: EstadoCita[] = ['pendiente', 'confirmada', 'cancelada'];

/** PATCH protegido: { estado: pendiente | confirmada | cancelada }. Una cita cancelada libera su hueco. */
export const PATCH = manejar(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await plantilla.exigir('citas:gestionar');
  const { id } = await params;
  const { estado } = await leerJson<{ estado?: EstadoCita }>(req);
  if (!estado || !ESTADOS.includes(estado)) throw new ErrorEntrada('Estado inválido.', 422);
  try {
    return json(await (await plantilla.capa()).citas.cambiarEstado(plantilla.sitioId(), id, estado));
  } catch {
    throw new ErrorEntrada('Cita no encontrada.', 404);
  }
});
