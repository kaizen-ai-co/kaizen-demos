import { ErrorEntrada, manejar } from '@kaizen/nucleo/servidor';
import { resolverTema, type SobrescriturasTema } from '@kaizen/tema';
import { leerCatalogo } from '@/lib/cotizacion';
import { generarPdfCotizacion } from '@/lib/pdf';
import { plantilla } from '@/lib/plantilla';

/**
 * PDF de una cotización. PROTOTIPO: para la demo, quien tenga el id (lo recibe el visitante al
 * enviar) puede descargarla sin sesión. En un servicio real se firma el enlace o se exige sesión.
 */
export const GET = manejar(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{4,64}$/.test(id)) throw new ErrorEntrada('No encontrada.', 404);
  const capa = await plantilla.capa();
  const cot = await capa.cotizaciones.obtener(plantilla.sitioId(), id);
  if (!cot) throw new ErrorEntrada('No encontrada.', 404);
  const { datos } = await plantilla.obtenerContenido();
  const { condiciones } = leerCatalogo(datos);
  const marca = String((datos.encabezado as { marca?: string } | undefined)?.marca ?? 'Catálogo');
  // El PDF usa los colores del tema del sitio (con sus sobrescrituras), igual que las páginas.
  const sobre = (datos._estructura as { tema?: SobrescriturasTema } | undefined)?.tema;
  const { colores } = resolverTema(sobre);
  const bytes = await generarPdfCotizacion({ cotizacion: cot, marca, condiciones, colores });
  return new Response(new Uint8Array(bytes), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `inline; filename="${cot.numero}.pdf"`,
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex',
    },
  });
});
