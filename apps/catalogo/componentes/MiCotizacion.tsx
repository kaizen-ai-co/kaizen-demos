'use client';

import type { ItemCotizacion, Totales } from '@kaizen/datos';
import { Aviso, Boton, BotonEnlace, CampoFormulario, Entrada, Tarjeta, formatearPrecio, img } from '@kaizen/ui';
import { FileDown, Minus, Plus, Trash2 } from 'lucide-react';
import * as React from 'react';
import { MAX_CANTIDAD, totalesDe, type Condiciones, type Producto } from '@/lib/cotizacion';
import { guardarCarrito, useCarrito } from './carrito';

interface Textos {
  titulo: string;
  textoVacio: string;
  textoBoton: string;
  mensajeExito: string;
}

type Resultado = { id: string; numero: string; items: ItemCotizacion[]; totales: Totales };

/**
 * "Mi cotización": líneas con cantidades, totales con la MISMA función que el servidor y el PDF,
 * datos del visitante y envío. El servidor vuelve a calcular con los precios publicados.
 */
export function MiCotizacion({ productos, condiciones, textos }: { productos: Producto[]; condiciones: Condiciones; textos: Textos }) {
  const [carrito, , listo] = useCarrito();
  const [enviando, setEnviando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resultado, setResultado] = React.useState<Resultado | null>(null);
  const moneda = condiciones.moneda ?? 'COP';

  const lineas = Object.entries(carrito)
    .map(([id, cantidad]) => ({ producto: productos.find((p) => p.id === id), cantidad }))
    .filter((l): l is { producto: Producto; cantidad: number } => !!l.producto && l.producto.disponible !== false);
  const totales = totalesDe(lineas.map((l) => ({ precioUnitario: l.producto.precio, cantidad: l.cantidad })), condiciones);

  const cambiar = (id: string, cantidad: number) => {
    const c = { ...carrito };
    if (cantidad <= 0) delete c[id];
    else c[id] = Math.min(Math.floor(cantidad), MAX_CANTIDAD);
    guardarCarrito(c);
  };

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
    if (!fd.nombre?.trim()) return setError('Escribe tu nombre.');
    if (!fd.correo?.trim() && !fd.telefono?.trim()) return setError('Deja un correo o un teléfono.');
    setError(null);
    setEnviando(true);
    try {
      const r = await fetch('/api/cotizaciones', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          items: lineas.map((l) => ({ productoId: l.producto.id, cantidad: l.cantidad })),
          cliente: { nombre: fd.nombre, empresa: fd.empresa, correo: fd.correo, telefono: fd.telefono },
          _trampa: fd._trampa,
        }),
      });
      const cuerpo = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(cuerpo.error ?? 'No pudimos generar la cotización.');
      setResultado(cuerpo);
      guardarCarrito({});
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  const tablaTotales = (t: Totales) => (
    <dl className="grid gap-1 text-sm">
      <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatearPrecio(t.subtotal, moneda)}</dd></div>
      {t.descuento > 0 && <div className="flex justify-between"><dt>Descuento ({Math.round((condiciones.descuentoPorcentaje ?? 0) * 100)} %)</dt><dd>−{formatearPrecio(t.descuento, moneda)}</dd></div>}
      <div className="flex justify-between"><dt>{condiciones.nombreImpuesto ?? 'Impuesto'} ({Math.round(condiciones.tasaImpuesto * 1000) / 10} %)</dt><dd>{formatearPrecio(t.impuesto, moneda)}</dd></div>
      <div className="mt-2 flex justify-between border-t border-borde pt-2 text-lg font-bold"><dt>Total</dt><dd>{formatearPrecio(t.total, moneda)}</dd></div>
    </dl>
  );

  if (resultado) {
    return (
      <div className="mx-auto grid max-w-2xl gap-6">
        <Aviso tono="exito"><p className="font-semibold">{textos.mensajeExito}</p></Aviso>
        <Tarjeta>
          <h2 className="text-xl">Cotización {resultado.numero}</h2>
          <ul className="my-4 grid gap-2 text-sm">
            {resultado.items.map((it) => (
              <li key={it.productoId} className="flex justify-between gap-4">
                <span>{it.cantidad} × {it.nombre}</span>
                <span>{formatearPrecio(it.precioUnitario * it.cantidad, moneda)}</span>
              </li>
            ))}
          </ul>
          {tablaTotales(resultado.totales)}
          <p className="mt-4 text-xs text-suave">Válida por {condiciones.validezDias} días. {condiciones.entrega}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <BotonEnlace href={`/api/cotizaciones/${resultado.id}/pdf`} target="_blank" rel="noreferrer"><FileDown aria-hidden /> Descargar PDF</BotonEnlace>
            <BotonEnlace href="/" variante="borde">Volver al catálogo</BotonEnlace>
          </div>
        </Tarjeta>
      </div>
    );
  }

  if (!listo) return <p className="text-suave">Cargando…</p>;

  if (!lineas.length) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <p className="text-suave">{textos.textoVacio}</p>
        <BotonEnlace href="/" className="mt-6">Ir al catálogo</BotonEnlace>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <section aria-label="Productos de la cotización" className="lg:col-span-3">
        <ul className="grid gap-3">
          {lineas.map(({ producto: p, cantidad }) => {
            const foto = img(p.foto, p.nombre);
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-4 rounded-lg border border-borde p-3">
                {foto && <img src={foto.src} alt="" className="size-16 rounded bg-superficie object-contain p-1" />}
                <div className="min-w-40 flex-1">
                  <p className="font-semibold">{p.nombre}</p>
                  <p className="text-sm text-suave">{formatearPrecio(p.precio, moneda)} / {p.unidad}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Boton variante="borde" tamano="icono" aria-label={`Quitar una unidad de ${p.nombre}`} onClick={() => cambiar(p.id, cantidad - 1)}><Minus /></Boton>
                  <Entrada
                    aria-label={`Cantidad de ${p.nombre}`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={MAX_CANTIDAD}
                    value={cantidad}
                    onChange={(e) => cambiar(p.id, Number(e.target.value) || 1)}
                    className="w-20 text-center"
                  />
                  <Boton variante="borde" tamano="icono" aria-label={`Agregar una unidad de ${p.nombre}`} onClick={() => cambiar(p.id, cantidad + 1)}><Plus /></Boton>
                </div>
                <p className="w-28 text-right font-semibold">{formatearPrecio(p.precio * cantidad, moneda)}</p>
                <Boton variante="fantasma" tamano="icono" aria-label={`Eliminar ${p.nombre}`} onClick={() => cambiar(p.id, 0)}><Trash2 /></Boton>
              </li>
            );
          })}
        </ul>
        <Tarjeta className="mt-4">{tablaTotales(totales)}</Tarjeta>
      </section>

      <section aria-label="Tus datos" className="lg:col-span-2">
        <Tarjeta>
          <form onSubmit={enviar} noValidate className="grid gap-4">
            <CampoFormulario id="cot-nombre" etiqueta="Nombre" requerido><Entrada name="nombre" autoComplete="name" placeholder="Nombre ficticio" /></CampoFormulario>
            <CampoFormulario id="cot-empresa" etiqueta="Empresa"><Entrada name="empresa" autoComplete="organization" /></CampoFormulario>
            <CampoFormulario id="cot-correo" etiqueta="Correo"><Entrada name="correo" type="email" autoComplete="email" placeholder="nombre@ejemplo.test" /></CampoFormulario>
            <CampoFormulario id="cot-telefono" etiqueta="Teléfono"><Entrada name="telefono" type="tel" inputMode="tel" autoComplete="tel" /></CampoFormulario>
            <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
              <label>No llenar<input type="text" name="_trampa" tabIndex={-1} autoComplete="off" /></label>
            </div>
            {error && <Aviso tono="peligro">{error}</Aviso>}
            <Boton type="submit" tamano="lg" disabled={enviando}>{enviando ? 'Generando…' : textos.textoBoton}</Boton>
            <p className="text-xs text-suave">Demo con datos ficticios: no escribas datos personales reales.</p>
          </form>
        </Tarjeta>
      </section>
    </div>
  );
}
