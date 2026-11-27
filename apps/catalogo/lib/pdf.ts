import type { Cotizacion } from '@kaizen/datos';
import { tema } from '@kaizen/tema';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { decimalesDe, totalesDe, type Condiciones } from './cotizacion';

/**
 * PDF de la cotización, generado en el servidor con pdf-lib (MIT, JavaScript puro):
 * corre igual en Vercel, Cloudflare o un contenedor en AWS, sin servicios externos.
 * Los totales se RECALCULAN con `totalesDe` (→ calcularTotales) desde los ítems guardados,
 * así pantalla, base de datos y PDF muestran la misma cifra.
 */

/** Las fuentes estándar del PDF usan WinAnsi: normaliza lo que no cabe ahí. */
function limpio(t: string): string {
  return t
    .replace(/[–—−]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, '...')
    .replace(/[  ]/g, ' ')
    .replace(/[^\x20-\x7e¡-ÿ\n]/g, '?');
}

export function formatoMoneda(valor: number, moneda = 'COP'): string {
  const dec = decimalesDe(moneda);
  const [entero, fraccion] = Math.abs(valor).toFixed(dec).split('.');
  const miles = entero!.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${valor < 0 ? '-' : ''}${moneda === 'USD' ? 'US$' : '$'} ${miles}${fraccion ? `,${fraccion}` : ''}`;
}

function partirLineas(texto: string, fuente: PDFFont, tamano: number, ancho: number): string[] {
  const salida: string[] = [];
  for (const parrafo of limpio(texto).split('\n')) {
    let linea = '';
    for (const palabra of parrafo.split(/\s+/)) {
      const prueba = linea ? `${linea} ${palabra}` : palabra;
      if (fuente.widthOfTextAtSize(prueba, tamano) > ancho && linea) {
        salida.push(linea);
        linea = palabra;
      } else linea = prueba;
    }
    salida.push(linea);
  }
  return salida;
}

/** Colores del tema que usa el PDF (los del sitio, con sus sobrescrituras). */
export type ColoresPdf = Pick<(typeof tema)['colores'], 'fondo' | 'texto' | 'suave' | 'superficie' | 'borde' | 'aviso'>;

/** #rrggbb → canales 0..1 para pdf-lib. */
function canales(hex: string): [number, number, number] {
  const n = /^#?([0-9a-f]{6})$/i.exec(hex.trim())?.[1] ?? '000000';
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255) as [number, number, number];
}
const color = (hex: string) => rgb(...canales(hex));
/** `frente` al `proporcion` (0..1) sobre `fondo`, como `bg-aviso/15` en CSS. */
function mezcla(frente: string, fondo: string, proporcion: number) {
  const [a, b] = [canales(frente), canales(fondo)];
  return rgb(...(a.map((v, i) => v * proporcion + b[i]! * (1 - proporcion)) as [number, number, number]));
}

export async function generarPdfCotizacion({
  cotizacion,
  marca,
  condiciones,
  colores = tema.colores,
}: {
  cotizacion: Cotizacion;
  marca: string;
  condiciones: Condiciones;
  colores?: ColoresPdf;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(limpio(`Cotización ${cotizacion.numero}`));
  doc.setProducer('Kaizen demos');
  const normal = await doc.embedFont(StandardFonts.Helvetica);
  const negrita = await doc.embedFont(StandardFonts.HelveticaBold);
  const moneda = condiciones.moneda ?? 'COP';
  const condicionesCalculo: Condiciones = {
    ...condiciones,
    tasaImpuesto: cotizacion.condiciones.tasaImpuesto,
    descuentoPorcentaje: cotizacion.condiciones.descuentoPorcentaje,
  };
  const totales = totalesDe(cotizacion.items, condicionesCalculo);

  const margen = 50;
  let pagina: PDFPage = doc.addPage([595.28, 841.89]); // A4
  const ancho = pagina.getWidth() - margen * 2;
  let y = pagina.getHeight() - margen;
  const gris = color(colores.suave);
  const colorTexto = color(colores.texto);
  const texto = (
    t: string,
    x: number,
    opciones: { f?: PDFFont; s?: number; c?: ReturnType<typeof rgb>; derecha?: boolean } = {},
  ) => {
    const f = opciones.f ?? normal;
    const s = opciones.s ?? 10;
    const t2 = limpio(t);
    const xx = opciones.derecha ? x - f.widthOfTextAtSize(t2, s) : x;
    pagina.drawText(t2, { x: xx, y, size: s, font: f, color: opciones.c ?? colorTexto });
  };
  const nuevaPaginaSiHaceFalta = (alto: number) => {
    if (y - alto < margen) {
      pagina = doc.addPage([595.28, 841.89]);
      y = pagina.getHeight() - margen;
    }
  };

  // Aviso de demo
  pagina.drawRectangle({
    x: 0,
    y: pagina.getHeight() - 22,
    width: pagina.getWidth(),
    height: 22,
    color: mezcla(colores.aviso, colores.fondo, 0.15),
  });
  y = pagina.getHeight() - 15;
  texto('DEMO CON DATOS FICTICIOS - no es una oferta comercial', margen, { s: 8, f: negrita });
  y = pagina.getHeight() - margen - 10;

  texto(marca, margen, { f: negrita, s: 18 });
  texto(`Cotización ${cotizacion.numero}`, margen + ancho, { f: negrita, s: 12, derecha: true });
  y -= 18;
  const fecha = new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', dateStyle: 'long' }).format(
    new Date(cotizacion.creadoEl),
  );
  texto(`Fecha: ${fecha}`, margen + ancho, { s: 9, c: gris, derecha: true });
  y -= 12;
  texto(`Válida por ${cotizacion.condiciones.validezDias} días`, margen + ancho, { s: 9, c: gris, derecha: true });

  y -= 28;
  texto('Cliente', margen, { f: negrita, s: 10 });
  y -= 14;
  const cli = cotizacion.cliente;
  for (const linea of [cli.nombre, cli.empresa, cli.correo, cli.telefono].filter(Boolean) as string[]) {
    texto(linea, margen, { s: 10 });
    y -= 13;
  }

  // Tabla
  y -= 14;
  const col = {
    producto: margen,
    cantidad: margen + ancho * 0.58,
    unitario: margen + ancho * 0.8,
    total: margen + ancho,
  };
  pagina.drawRectangle({ x: margen - 6, y: y - 6, width: ancho + 12, height: 20, color: color(colores.superficie) });
  texto('Producto', col.producto, { f: negrita, s: 9 });
  texto('Cantidad', col.cantidad, { f: negrita, s: 9, derecha: true });
  texto('Unitario', col.unitario, { f: negrita, s: 9, derecha: true });
  texto('Total', col.total, { f: negrita, s: 9, derecha: true });
  y -= 22;
  for (const it of cotizacion.items) {
    const lineas = partirLineas(it.nombre, normal, 9.5, ancho * 0.48);
    nuevaPaginaSiHaceFalta(lineas.length * 12 + 8);
    const yFila = y;
    lineas.forEach((l, i) => {
      y = yFila - i * 12;
      texto(l, col.producto, { s: 9.5 });
    });
    y = yFila;
    texto(`${it.cantidad} ${it.unidad}`, col.cantidad, { s: 9.5, derecha: true });
    texto(formatoMoneda(it.precioUnitario, moneda), col.unitario, { s: 9.5, derecha: true });
    texto(formatoMoneda(it.precioUnitario * it.cantidad, moneda), col.total, { s: 9.5, derecha: true });
    y -= lineas.length * 12 + 6;
    pagina.drawLine({
      start: { x: margen - 6, y: y + 3 },
      end: { x: margen + ancho + 6, y: y + 3 },
      thickness: 0.5,
      color: color(colores.borde),
    });
    y -= 8;
  }

  // Totales
  nuevaPaginaSiHaceFalta(110);
  y -= 6;
  const filas: [string, number, boolean?][] = [['Subtotal', totales.subtotal]];
  if (totales.descuento > 0)
    filas.push([
      `Descuento (${Math.round((cotizacion.condiciones.descuentoPorcentaje ?? 0) * 100)} %)`,
      -totales.descuento,
    ]);
  filas.push([
    `${condiciones.nombreImpuesto ?? 'Impuesto'} (${Math.round(cotizacion.condiciones.tasaImpuesto * 1000) / 10} %)`,
    totales.impuesto,
  ]);
  filas.push(['Total', totales.total, true]);
  for (const [etiqueta, valor, fuerte] of filas) {
    texto(etiqueta, col.unitario, { f: fuerte ? negrita : normal, s: fuerte ? 12 : 10, derecha: true });
    texto(formatoMoneda(valor, moneda), col.total, {
      f: fuerte ? negrita : normal,
      s: fuerte ? 12 : 10,
      derecha: true,
    });
    y -= fuerte ? 18 : 14;
  }

  // Condiciones y texto al pie
  y -= 16;
  const pie = [`Entrega: ${cotizacion.condiciones.entrega}`, condiciones.textoCotizacion ?? '']
    .filter(Boolean)
    .join('\n');
  for (const l of partirLineas(pie, normal, 9, ancho)) {
    nuevaPaginaSiHaceFalta(12);
    texto(l, margen, { s: 9, c: gris });
    y -= 12;
  }

  return doc.save();
}
