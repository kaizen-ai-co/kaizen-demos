'use client';

import { Aparecer, Insignia, cn, img, lista, texto } from '@kaizen/ui';
import type { PropsBloque } from '@kaizen/ui/bloques';
import { ArrowRight } from 'lucide-react';
import * as React from 'react';

export interface Caso {
  id: string;
  titulo: string;
  sector: string;
  imagen?: unknown;
  resumen: string;
  resultado: string;
  texto?: string;
}

/**
 * Galería de casos con filtro por sector (plantilla 2).
 * Campos: titulo, subtitulo, textoTodos, textoFiltro, textoVerCaso, items[{id, titulo, sector, imagen, resumen, resultado, texto}]
 * Cada caso enlaza a /casos/<id>, página generada desde el mismo contenido.
 */
export function GaleriaCasos({ id = 'casos', datos }: PropsBloque) {
  const casos = lista<Caso>(datos.items);
  const sectores = React.useMemo(() => Array.from(new Set(casos.map((c) => c.sector).filter(Boolean))), [casos]);
  const [filtro, setFiltro] = React.useState<string | null>(null);
  const visibles = filtro ? casos.filter((c) => c.sector === filtro) : casos;

  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="k-seccion bg-superficie">
      <div className="k-contenedor">
        <Aparecer className="mx-auto mb-8 max-w-2xl text-center">
          <h2 id={`${id}-titulo`} className="text-3xl md:text-4xl">
            {texto(datos.titulo, 'Casos')}
          </h2>
          {texto(datos.subtitulo) && <p className="mt-3 text-lg text-suave">{texto(datos.subtitulo)}</p>}
        </Aparecer>

        {sectores.length > 1 && (
          <div
            role="group"
            aria-label={texto(datos.textoFiltro, 'Filtrar casos por sector')}
            className="mb-8 flex flex-wrap justify-center gap-2"
          >
            {[null, ...sectores].map((s) => (
              <button
                key={s ?? 'todos'}
                type="button"
                aria-pressed={filtro === s}
                onClick={() => setFiltro(s)}
                className={cn(
                  'min-h-10 rounded-full border px-4 text-sm font-medium transition-colors',
                  filtro === s
                    ? 'border-primario bg-primario text-primario-texto'
                    : 'border-borde bg-fondo hover:bg-secundario',
                )}
              >
                {s ?? texto(datos.textoTodos, 'Todos')}
              </button>
            ))}
          </div>
        )}

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
          {visibles.map((c) => {
            const im = img(c.imagen, c.titulo);
            return (
              <li key={c.id}>
                <a
                  href={`/casos/${c.id}`}
                  className="group flex h-full flex-col overflow-hidden rounded-lg border border-borde bg-fondo shadow-sm transition-shadow hover:shadow-md"
                >
                  {im && (
                    <img
                      src={im.src}
                      alt={im.alt}
                      className="aspect-[16/10] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transform-none"
                    />
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <Insignia className="self-start">{c.sector}</Insignia>
                    <h3 className="mt-3 text-lg">{c.titulo}</h3>
                    <p className="mt-2 flex-1 text-sm text-suave">{c.resumen}</p>
                    <p className="mt-4 font-semibold text-primario">{c.resultado}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium">
                      {texto(datos.textoVerCaso, 'Ver caso')} <ArrowRight aria-hidden className="size-4" />
                    </span>
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
