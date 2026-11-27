import { json, manejar } from '@kaizen/nucleo/servidor';
import { asignarAlCrear } from '@/lib/crm';
import { plantilla } from '@/lib/plantilla';

/** Crea los leads de ejemplo del contenido publicado. Protegido: leads:gestionar. */
export const POST = manejar(async () => {
  await plantilla.exigir('leads:gestionar');
  const { datos, sitioId } = await plantilla.obtenerContenido();
  const capa = await plantilla.capa();
  const ejemplos = ((datos.ejemplos as { leads?: Record<string, string>[] })?.leads ?? []).slice(0, 20);
  let creados = 0;
  for (const e of ejemplos) {
    if (!e.nombre) continue;
    const nuevo = await asignarAlCrear(
      {
        sitioId,
        nombre: e.nombre,
        contacto: { telefono: e.telefono || undefined, correo: e.correo || undefined },
        origen: e.origen || 'formulario-movil',
        campos: e.mensaje ? { mensaje: e.mensaje } : {},
      },
      capa,
      datos,
    );
    await capa.leads.crear(nuevo);
    creados++;
  }
  return json({ ok: true, creados }, 201);
});
