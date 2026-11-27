import { crearLimitador } from '@kaizen/modulos/limite';
import { ErrorEntrada, ipDe, json, leerJson, limpiar, manejar } from '@kaizen/nucleo/servidor';
import { ErrorPedido, armarCotizacion, leerCatalogo, type LineaPedido } from '@/lib/cotizacion';
import { plantilla } from '@/lib/plantilla';

const limitador = crearLimitador();

/**
 * POST público: el visitante envía SOLO productos y cantidades + sus datos.
 * El servidor toma los precios y condiciones del contenido PUBLICADO y recalcula los totales.
 */
export const POST = manejar(async (req: Request) => {
  const cuerpo = await leerJson<{ items?: LineaPedido[]; cliente?: Record<string, unknown>; _trampa?: string }>(
    req,
    30_000,
  );
  if (limpiar(cuerpo._trampa)) return json({ ok: true, id: 'descartado' });
  const permitido = limitador.permitir(`cot:${ipDe(req)}`);
  if (!permitido.ok) throw new ErrorEntrada('Demasiadas cotizaciones seguidas. Intenta más tarde.', 429);

  const c = cuerpo.cliente ?? {};
  const nombre = limpiar(c.nombre, 120);
  const correo = limpiar(c.correo, 160).toLowerCase();
  const telefono = limpiar(c.telefono, 30);
  const empresa = limpiar(c.empresa, 120);
  if (!nombre) throw new ErrorEntrada('Escribe tu nombre.', 422);
  if (!correo && !telefono) throw new ErrorEntrada('Deja un correo o un teléfono.', 422);
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) throw new ErrorEntrada('Revisa el correo.', 422);
  if (telefono && !/^[+()\d\s-]{7,20}$/.test(telefono)) throw new ErrorEntrada('Revisa el teléfono.', 422);

  const { datos } = await plantilla.obtenerContenido(); // siempre lo publicado
  const { productos, condiciones } = leerCatalogo(datos);
  let armada;
  try {
    armada = armarCotizacion(productos, condiciones, Array.isArray(cuerpo.items) ? cuerpo.items : []);
  } catch (e) {
    if (e instanceof ErrorPedido) throw new ErrorEntrada(e.message, 422);
    throw e;
  }

  const capa = await plantilla.capa();
  const cot = await capa.cotizaciones.crear({
    sitioId: plantilla.sitioId(),
    cliente: { nombre, empresa: empresa || undefined, correo: correo || undefined, telefono: telefono || undefined },
    ...armada,
  });
  return json(
    { ok: true, id: cot.id, numero: cot.numero, items: cot.items, totales: cot.totales, condiciones: cot.condiciones },
    201,
  );
});

/** GET protegido: lista de cotizaciones recibidas. */
export const GET = manejar(async () => {
  await plantilla.exigir('cotizaciones:leer');
  const capa = await plantilla.capa();
  return json(await capa.cotizaciones.listar(plantilla.sitioId()));
});
