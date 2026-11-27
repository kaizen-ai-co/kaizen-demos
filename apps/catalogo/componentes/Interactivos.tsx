'use client';

import { Boton, Entrada, Insignia, cn, formatearPrecio, img } from '@kaizen/ui';
import { Check, Search, ShoppingBag } from 'lucide-react';
import * as React from 'react';
import type { Categoria, Producto } from '@/lib/cotizacion';
import { agregarAlCarrito, useCarrito } from './carrito';

/** Enlace a "Mi cotización" con el número de productos elegidos. */
export function EnlaceCotizacion({ texto }: { texto: string }) {
  const [carrito, , listo] = useCarrito();
  const n = Object.values(carrito).reduce((s, x) => s + x, 0);
  return (
    <a
      href="/cotizacion"
      className="inline-flex min-h-10 items-center gap-2 rounded-md bg-primario px-4 text-sm font-semibold text-primario-texto hover:opacity-90"
    >
      <ShoppingBag aria-hidden className="size-4" />
      {texto}
      {listo && n > 0 && (
        <span className="rounded-full bg-fondo px-2 text-xs text-texto" aria-label={`${n} productos`}>
          {n}
        </span>
      )}
    </a>
  );
}

export function BotonAgregar({
  productoId,
  texto,
  deshabilitado,
  textoDeshabilitado,
  textoAgregado,
  className,
}: {
  productoId: string;
  texto: string;
  deshabilitado?: boolean;
  textoDeshabilitado?: string;
  textoAgregado?: string;
  className?: string;
}) {
  const [agregado, setAgregado] = React.useState(false);
  React.useEffect(() => {
    if (!agregado) return;
    const t = setTimeout(() => setAgregado(false), 1500);
    return () => clearTimeout(t);
  }, [agregado]);
  if (deshabilitado)
    return (
      <Boton variante="borde" disabled className={className}>
        {textoDeshabilitado ?? 'No disponible'}
      </Boton>
    );
  return (
    <Boton
      className={className}
      variante={agregado ? 'secundario' : 'primario'}
      onClick={() => {
        agregarAlCarrito(productoId);
        setAgregado(true);
      }}
    >
      {agregado ? (
        <>
          <Check aria-hidden /> {textoAgregado ?? 'Agregado'}
        </>
      ) : (
        texto
      )}
    </Boton>
  );
}

/** Listado del catálogo con filtro por categoría y búsqueda por texto. */
export function Catalogo({
  productos,
  categorias,
  moneda,
  textos,
}: {
  productos: Producto[];
  categorias: Categoria[];
  moneda: string;
  textos: {
    buscar: string;
    todas: string;
    agregar: string;
    agotado: string;
    agregado: string;
    sinResultados: string;
    filtrarCategorias: string;
  };
}) {
  const [categoria, setCategoria] = React.useState<string | null>(null);
  const [busqueda, setBusqueda] = React.useState('');
  const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const q = normalizar(busqueda.trim());
  const visibles = productos.filter(
    (p) =>
      (!categoria || p.categoria === categoria) && (!q || normalizar(`${p.nombre} ${p.descripcion ?? ''}`).includes(q)),
  );
  const nombreCategoria = (id: string) => categorias.find((c) => c.id === id)?.nombre ?? id;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div role="group" aria-label={textos.filtrarCategorias} className="flex flex-wrap gap-2">
          {[{ id: null as string | null, nombre: textos.todas }, ...categorias].map((c) => (
            <button
              key={c.id ?? 'todas'}
              type="button"
              aria-pressed={categoria === c.id}
              onClick={() => setCategoria(c.id)}
              className={cn(
                'min-h-10 rounded-full border px-4 text-sm font-medium',
                categoria === c.id
                  ? 'border-primario bg-primario text-primario-texto'
                  : 'border-borde bg-fondo hover:bg-secundario',
              )}
            >
              {c.nombre}
            </button>
          ))}
        </div>
        <label className="relative block md:w-72">
          <span className="sr-only">{textos.buscar}</span>
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-suave"
          />
          <Entrada
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={textos.buscar}
            className="pl-9"
          />
        </label>
      </div>

      <p className="sr-only" aria-live="polite">
        {visibles.length} productos
      </p>
      {visibles.length === 0 ? (
        <p className="rounded-lg border border-dashed border-borde p-8 text-center text-suave">
          {textos.sinResultados}
        </p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((p) => {
            const foto = img(p.foto, p.nombre);
            const agotado = p.disponible === false;
            return (
              <li
                key={p.id}
                className="flex flex-col overflow-hidden rounded-lg border border-borde bg-fondo shadow-sm"
              >
                <a href={`/productos/${p.id}`} className="block">
                  {foto ? (
                    <img
                      src={foto.src}
                      alt={foto.alt}
                      className="aspect-[4/3] w-full bg-superficie object-contain p-4"
                    />
                  ) : (
                    <div className="aspect-[4/3] bg-superficie" />
                  )}
                </a>
                <div className="flex flex-1 flex-col p-4">
                  <Insignia className="self-start">{nombreCategoria(p.categoria)}</Insignia>
                  <h3 className="mt-2 text-base">
                    <a href={`/productos/${p.id}`} className="hover:underline">
                      {p.nombre}
                    </a>
                  </h3>
                  {p.descripcion && <p className="mt-1 line-clamp-2 text-sm text-suave">{p.descripcion}</p>}
                  <p className="mt-3 text-lg font-bold">
                    {formatearPrecio(p.precio, moneda)}{' '}
                    <span className="text-sm font-normal text-suave">/ {p.unidad}</span>
                  </p>
                  <BotonAgregar
                    className="mt-4"
                    productoId={p.id}
                    texto={textos.agregar}
                    deshabilitado={agotado}
                    textoDeshabilitado={textos.agotado}
                    textoAgregado={textos.agregado}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
