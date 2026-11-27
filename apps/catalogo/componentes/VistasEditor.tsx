import type { Cotizacion } from '@kaizen/datos';
import { BotonEnlace, EstadoFuncion, Insignia, formatearFecha, formatearPrecio } from '@kaizen/ui';

/** Vista "Cotizaciones" del editor (solo lectura). */
export function VistaCotizaciones({ cotizaciones, moneda }: { cotizaciones: Cotizacion[]; moneda: string }) {
  if (!cotizaciones.length) {
    return <p className="text-sm text-suave">Todavía no hay cotizaciones. Arma una desde «Mi cotización» en la página pública.</p>;
  }
  return (
    <div className="grid gap-2">
      <p className="text-xs text-suave">{cotizaciones.length} cotización(es) · solo lectura · datos ficticios</p>
      <ul className="grid gap-2">
        {cotizaciones.map((c) => (
          <li key={c.id} className="rounded-md border border-borde p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <strong>{c.numero}</strong>
              <Insignia tono={c.estado === 'recibida' ? 'primario' : 'neutro'}>{c.estado}</Insignia>
            </div>
            <p>{c.cliente.nombre}{c.cliente.empresa ? ` · ${c.cliente.empresa}` : ''}</p>
            <p className="text-suave">{[c.cliente.correo, c.cliente.telefono].filter(Boolean).join(' · ')}</p>
            <p className="text-xs text-suave">{formatearFecha(c.creadoEl)} · {c.items.length} producto(s)</p>
            <p className="mt-1 font-semibold">Total {formatearPrecio(c.totales.total, moneda)}</p>
            <a href={`/api/cotizaciones/${c.id}/pdf`} target="_blank" rel="noreferrer" className="text-xs underline">Ver PDF</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Vista "Importar CSV". PROTOTIPO: explica el formato y ofrece el archivo de ejemplo.
 * La importación automática a la tabla de productos queda pendiente (ver docs/plantillas/03-catalogo.md).
 */
export function VistaImportarCsv() {
  return (
    <div className="grid gap-3 text-sm">
      <div className="flex items-center gap-2"><strong>Importar productos desde CSV</strong><EstadoFuncion estado="prototipo" /></div>
      <p className="text-suave">El archivo debe usar coma como separador y esta primera fila de columnas:</p>
      <pre className="overflow-x-auto rounded bg-superficie p-2 text-[11px]">id,nombre,descripcion,precio,unidad,categoria,disponible</pre>
      <ul className="list-disc pl-5 text-suave">
        <li><code>id</code>: minúsculas y guiones, único (p. ej. <code>resma-carta</code>).</li>
        <li><code>precio</code>: número sin puntos ni símbolo (p. ej. <code>18900</code>). Siempre ficticio.</li>
        <li><code>categoria</code>: el id de una categoría existente.</li>
        <li><code>disponible</code>: <code>si</code> o <code>no</code>.</li>
      </ul>
      <BotonEnlace href="/productos-ejemplo.csv" download variante="borde" tamano="sm">Descargar CSV de ejemplo</BotonEnlace>
      <p className="text-xs text-suave">Por ahora los productos se agregan en «Contenido → Productos y categorías». La carga del CSV directo a esa tabla está en desarrollo.</p>
    </div>
  );
}
