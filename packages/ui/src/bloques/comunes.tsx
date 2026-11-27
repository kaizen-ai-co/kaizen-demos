import { Check, Quote } from 'lucide-react';
import type { ReactNode } from 'react';
import { Aparecer } from '../demo';
import { Icono } from '../iconos';
import { CAMPOS_LEAD_POR_DEFECTO, FormularioLead, type CampoLead } from '../modulos/FormularioLead';
import { BotonEnlace, Insignia, Tarjeta } from '../primitivos';
import { cn, formatearPrecio, img, lista, texto } from '../utilidades';

/**
 * Bloques de página reutilizables. Cada bloque recibe `datos` (los valores de su
 * sección en el contenido publicado) y, si tiene, `variante`.
 *
 * CONTRATO: los nombres de campo que lee cada bloque están en su comentario.
 * El esquema de la plantilla debe usar esos mismos ids. Para un bloque nuevo:
 *   1) créalo aquí o en la app, 2) regístralo en BLOQUES (index.ts) con el id de la sección,
 *   3) agrega la sección al contenido.schema.json, 4) siembra datos ficticios.
 */

export interface PropsBloque {
  id?: string;
  datos: Record<string, unknown>;
  variante?: string;
  /** Contexto común de la página (nombre de la marca, contacto, etc.). */
  contexto?: Record<string, unknown>;
}

function Seccion({
  id,
  titulo,
  subtitulo,
  children,
  className,
  fondo,
}: {
  id?: string;
  titulo?: string;
  subtitulo?: string;
  children: ReactNode;
  className?: string;
  fondo?: 'superficie';
}) {
  return (
    <section
      id={id}
      aria-labelledby={titulo && id ? `${id}-titulo` : undefined}
      className={cn('k-seccion', fondo === 'superficie' && 'bg-superficie', className)}
    >
      <div className="k-contenedor">
        {(titulo || subtitulo) && (
          <Aparecer className="mx-auto mb-10 max-w-2xl text-center">
            {titulo && (
              <h2 id={id ? `${id}-titulo` : undefined} className="text-3xl md:text-4xl">
                {titulo}
              </h2>
            )}
            {subtitulo && <p className="mt-3 text-lg text-suave">{subtitulo}</p>}
          </Aparecer>
        )}
        {children}
      </div>
    </section>
  );
}

/** Campos: marca, logo(imagen), enlaces[{texto, destino}], textoBoton, destinoBoton */
export function Encabezado({ datos }: PropsBloque) {
  const logo = img(datos.logo, texto(datos.marca));
  return (
    <header className="sticky top-0 z-40 border-b border-borde bg-fondo/90 backdrop-blur">
      <div className="k-contenedor flex h-16 items-center justify-between gap-4">
        <a href="#" className="flex items-center gap-2 font-bold">
          {logo ? <img src={logo.src} alt={logo.alt} className="h-8 w-auto" /> : null}
          <span>{texto(datos.marca, 'Marca')}</span>
        </a>
        <nav aria-label="Principal" className="hidden gap-6 text-sm md:flex">
          {lista<{ texto: string; destino: string }>(datos.enlaces).map((e) => (
            <a key={e.destino + e.texto} href={e.destino} className="text-suave hover:text-texto">
              {e.texto}
            </a>
          ))}
        </nav>
        {texto(datos.textoBoton) && (
          <BotonEnlace href={texto(datos.destinoBoton, '#contacto')} tamano="sm">
            {texto(datos.textoBoton)}
          </BotonEnlace>
        )}
      </div>
    </header>
  );
}

/** Campos: etiqueta, titulo, subtitulo, textoBoton, destinoBoton, textoBoton2, destinoBoton2, imagen. Variantes: centrada | dividida | fondo */
export function Portada({ datos, variante = 'centrada' }: PropsBloque) {
  const imagen = img(datos.imagen);
  const botones = (
    <div className={cn('mt-8 flex flex-wrap gap-3', variante === 'centrada' && 'justify-center')}>
      {texto(datos.textoBoton) && (
        <BotonEnlace tamano="lg" href={texto(datos.destinoBoton, '#contacto')}>
          {texto(datos.textoBoton)}
        </BotonEnlace>
      )}
      {texto(datos.textoBoton2) && (
        <BotonEnlace tamano="lg" variante="borde" href={texto(datos.destinoBoton2, '#servicios')}>
          {texto(datos.textoBoton2)}
        </BotonEnlace>
      )}
    </div>
  );
  const encabezado = (
    <>
      {texto(datos.etiqueta) && (
        <Insignia tono="primario" className="mb-4">
          {texto(datos.etiqueta)}
        </Insignia>
      )}
      <h1 className="text-4xl tracking-tight md:text-6xl">{texto(datos.titulo, 'Título de la portada')}</h1>
      {texto(datos.subtitulo) && <p className="mt-5 text-lg text-suave md:text-xl">{texto(datos.subtitulo)}</p>}
    </>
  );

  if (variante === 'fondo' && imagen) {
    return (
      <section className="relative isolate overflow-hidden">
        <img src={imagen.src} alt={imagen.alt} className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-black/55" />
        <div className="k-contenedor py-28 text-white md:py-40 [&_p]:text-white/85">
          <div className="max-w-2xl">
            {encabezado}
            {botones}
          </div>
        </div>
      </section>
    );
  }
  if (variante === 'dividida') {
    return (
      <section className="k-seccion">
        <div className="k-contenedor grid items-center gap-10 md:grid-cols-2">
          <div>
            {encabezado}
            {botones}
          </div>
          {imagen && (
            <img src={imagen.src} alt={imagen.alt} className="aspect-[4/3] w-full rounded-xl object-cover shadow-lg" />
          )}
        </div>
      </section>
    );
  }
  return (
    <section className="k-seccion">
      <div className="k-contenedor mx-auto max-w-3xl text-center">
        {encabezado}
        {botones}
      </div>
      {imagen && (
        <div className="k-contenedor mt-12">
          <img
            src={imagen.src}
            alt={imagen.alt}
            className="mx-auto aspect-[16/7] w-full rounded-xl object-cover shadow-lg"
          />
        </div>
      )}
    </section>
  );
}

/** Campos: titulo, descripcion, dolores[{texto}] — el problema en palabras del cliente. */
export function Problema({ id = 'problema', datos }: PropsBloque) {
  return (
    <Seccion id={id} titulo={texto(datos.titulo)} subtitulo={texto(datos.descripcion)} fondo="superficie">
      <ul className="mx-auto grid max-w-3xl gap-3">
        {lista<{ texto: string }>(datos.dolores).map((d, i) => (
          <Aparecer as="li" key={i} className="flex gap-3 rounded-lg border border-borde bg-fondo p-4">
            <span aria-hidden className="mt-1 size-2 shrink-0 rounded-full bg-peligro" />
            <span>“{d.texto}”</span>
          </Aparecer>
        ))}
      </ul>
    </Seccion>
  );
}

/** Campos: titulo, subtitulo, items[{icono, titulo, descripcion}] */
export function Servicios({ id = 'servicios', datos }: PropsBloque) {
  return (
    <Seccion id={id} titulo={texto(datos.titulo)} subtitulo={texto(datos.subtitulo)}>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {lista<{ icono?: string; titulo: string; descripcion: string }>(datos.items).map((s, i) => (
          <Aparecer key={i}>
            <Tarjeta className="h-full">
              <div className="mb-4 inline-flex size-11 items-center justify-center rounded-lg bg-secundario text-secundario-texto">
                <Icono nombre={s.icono} className="size-5" />
              </div>
              <h3 className="text-lg">{s.titulo}</h3>
              <p className="mt-2 text-suave">{s.descripcion}</p>
            </Tarjeta>
          </Aparecer>
        ))}
      </div>
    </Seccion>
  );
}

/** Campos: titulo, subtitulo, pasos[{titulo, descripcion}] */
export function ComoTrabajamos({ id = 'como-trabajamos', datos }: PropsBloque) {
  return (
    <Seccion id={id} titulo={texto(datos.titulo)} subtitulo={texto(datos.subtitulo)} fondo="superficie">
      <ol className="grid gap-6 md:grid-cols-4">
        {lista<{ titulo: string; descripcion: string }>(datos.pasos).map((p, i) => (
          <Aparecer as="li" key={i} className="relative rounded-lg border border-borde bg-fondo p-6">
            <span className="mb-3 inline-flex size-8 items-center justify-center rounded-full bg-primario text-sm font-bold text-primario-texto">
              {i + 1}
            </span>
            <h3 className="text-base">{p.titulo}</h3>
            <p className="mt-1 text-sm text-suave">{p.descripcion}</p>
          </Aparecer>
        ))}
      </ol>
    </Seccion>
  );
}

/** Campos: titulo, items[{texto, nombre, cargo, foto(imagen)}] — nombres ficticios. */
export function Testimonios({ id = 'testimonios', datos }: PropsBloque) {
  return (
    <Seccion id={id} titulo={texto(datos.titulo)}>
      <div className="grid gap-6 md:grid-cols-3">
        {lista<{ texto: string; nombre: string; cargo?: string; foto?: unknown }>(datos.items).map((t, i) => {
          const foto = img(t.foto, t.nombre);
          return (
            <Aparecer key={i}>
              <Tarjeta className="flex h-full flex-col">
                <Quote aria-hidden className="size-6 text-primario" />
                <blockquote className="mt-3 flex-1">{t.texto}</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  {foto && <img src={foto.src} alt="" className="size-10 rounded-full object-cover" />}
                  <span>
                    <span className="block font-semibold">{t.nombre}</span>
                    {t.cargo && <span className="block text-sm text-suave">{t.cargo}</span>}
                  </span>
                </figcaption>
              </Tarjeta>
            </Aparecer>
          );
        })}
      </div>
    </Seccion>
  );
}

/**
 * Campos: titulo, subtitulo, moneda, planes[{nombre, precio, periodo, descripcion, beneficios[{texto}], destacado, textoBoton}]
 * Variantes: tarjetas | tabla | destacado
 */
export function Precios({ id = 'precios', datos, variante = 'tarjetas' }: PropsBloque) {
  const moneda = texto(datos.moneda, 'COP');
  const planes = lista<{
    nombre: string;
    precio: number;
    periodo?: string;
    descripcion?: string;
    beneficios?: { texto: string }[];
    destacado?: boolean;
    textoBoton?: string;
  }>(datos.planes);

  if (variante === 'tabla') {
    return (
      <Seccion id={id} titulo={texto(datos.titulo)} subtitulo={texto(datos.subtitulo)} fondo="superficie">
        <div className="overflow-x-auto rounded-lg border border-borde bg-fondo">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <caption className="sr-only">{texto(datos.titulo, 'Planes')}</caption>
            <thead>
              <tr className="border-b border-borde">
                <th className="p-4">Plan</th>
                <th className="p-4">Incluye</th>
                <th className="p-4 text-right">Precio</th>
              </tr>
            </thead>
            <tbody>
              {planes.map((p) => (
                <tr key={p.nombre} className="border-b border-borde last:border-0">
                  <th scope="row" className="p-4 font-semibold">
                    {p.nombre}
                  </th>
                  <td className="p-4 text-suave">{(p.beneficios ?? []).map((b) => b.texto).join(' · ')}</td>
                  <td className="p-4 text-right font-bold">
                    {formatearPrecio(p.precio, moneda)}
                    {p.periodo && <span className="font-normal text-suave"> /{p.periodo}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Seccion>
    );
  }

  return (
    <Seccion id={id} titulo={texto(datos.titulo)} subtitulo={texto(datos.subtitulo)} fondo="superficie">
      <div className={cn('grid gap-6', planes.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2', 'mx-auto max-w-5xl')}>
        {planes.map((p) => {
          const resaltado = variante === 'destacado' && p.destacado;
          return (
            <Aparecer key={p.nombre}>
              <Tarjeta
                className={cn(
                  'flex h-full flex-col',
                  p.destacado && 'border-primario ring-2 ring-primario',
                  resaltado && 'md:-my-4 md:py-10',
                )}
              >
                {p.destacado && (
                  <Insignia tono="primario" className="mb-3 self-start">
                    Recomendado
                  </Insignia>
                )}
                <h3 className="text-xl">{p.nombre}</h3>
                {p.descripcion && <p className="mt-1 text-sm text-suave">{p.descripcion}</p>}
                <p className="mt-5 text-3xl font-bold">
                  {formatearPrecio(p.precio, moneda)}
                  {p.periodo && <span className="text-base font-normal text-suave"> /{p.periodo}</span>}
                </p>
                <ul className="mt-6 grid flex-1 gap-2 text-sm">
                  {(p.beneficios ?? []).map((b, i) => (
                    <li key={i} className="flex gap-2">
                      <Check aria-hidden className="mt-0.5 size-4 text-exito" />
                      {b.texto}
                    </li>
                  ))}
                </ul>
                <BotonEnlace href="#contacto" className="mt-8" variante={p.destacado ? 'primario' : 'borde'}>
                  {p.textoBoton || 'Quiero este plan'}
                </BotonEnlace>
              </Tarjeta>
            </Aparecer>
          );
        })}
      </div>
    </Seccion>
  );
}

/** Campos: titulo, preguntas[{pregunta, respuesta}] */
export function PreguntasFrecuentes({ id = 'preguntas', datos }: PropsBloque) {
  return (
    <Seccion id={id} titulo={texto(datos.titulo)}>
      <div className="mx-auto grid max-w-3xl gap-3">
        {lista<{ pregunta: string; respuesta: string }>(datos.preguntas).map((p, i) => (
          <details key={i} className="group rounded-lg border border-borde p-4 open:bg-superficie">
            <summary className="cursor-pointer list-none font-semibold marker:hidden">
              <span className="flex items-center justify-between gap-4">
                {p.pregunta}
                <span aria-hidden className="transition group-open:rotate-45">
                  +
                </span>
              </span>
            </summary>
            <p className="mt-3 text-suave">{p.respuesta}</p>
          </details>
        ))}
      </div>
    </Seccion>
  );
}

/**
 * Campos: titulo, subtitulo, camposFormulario[{id, etiqueta, tipo, requerido, opciones[]}], textoBoton,
 * mensajeExito, correo, telefono, direccion, horario
 */
export function Contacto({ id = 'contacto', datos, contexto }: PropsBloque) {
  const campos = lista<CampoLead & { opciones?: unknown }>(datos.camposFormulario).map((c) => ({
    ...c,
    opciones: Array.isArray(c.opciones)
      ? (c.opciones as unknown[]).map((o) => (typeof o === 'string' ? o : ((o as { texto?: string })?.texto ?? '')))
      : undefined,
  }));
  return (
    <Seccion id={id} titulo={texto(datos.titulo)} subtitulo={texto(datos.subtitulo)}>
      <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-5">
        <div className="space-y-4 md:col-span-2">
          {texto(datos.correo) && (
            <p>
              <span className="block text-sm text-suave">Correo</span>
              {texto(datos.correo)}
            </p>
          )}
          {texto(datos.telefono) && (
            <p>
              <span className="block text-sm text-suave">Teléfono</span>
              {texto(datos.telefono)}
            </p>
          )}
          {texto(datos.direccion) && (
            <p>
              <span className="block text-sm text-suave">Dirección</span>
              {texto(datos.direccion)}
            </p>
          )}
          {texto(datos.horario) && (
            <p>
              <span className="block text-sm text-suave">Horario</span>
              {texto(datos.horario)}
            </p>
          )}
        </div>
        <Tarjeta className="md:col-span-3">
          <FormularioLead
            campos={campos.length ? campos : CAMPOS_LEAD_POR_DEFECTO}
            origen={texto(contexto?.origen as string, 'formulario-web')}
            extra={contexto?.extraLead as Record<string, unknown> | undefined}
            textoBoton={texto(datos.textoBoton, 'Enviar')}
            mensajeExito={texto(datos.mensajeExito) || undefined}
          />
        </Tarjeta>
      </div>
    </Seccion>
  );
}

/** Campos: texto, enlaces[{texto, destino}], redes[{texto, destino}] */
export function Pie({ datos }: PropsBloque) {
  return (
    <footer className="border-t border-borde bg-superficie">
      <div className="k-contenedor flex flex-col gap-4 py-10 text-sm text-suave md:flex-row md:items-center md:justify-between">
        <p>{texto(datos.texto, `© ${new Date().getFullYear()} Marca ficticia`)}</p>
        <nav aria-label="Pie" className="flex flex-wrap gap-4">
          {[
            ...lista<{ texto: string; destino: string }>(datos.enlaces),
            ...lista<{ texto: string; destino: string }>(datos.redes),
          ].map((e) => (
            <a key={e.texto + e.destino} href={e.destino} className="hover:text-texto">
              {e.texto}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}

/** Campos: titulo, texto, imagen, puntos[{texto}] */
export function QuienesSomos({ id = 'quienes-somos', datos }: PropsBloque) {
  const imagen = img(datos.imagen);
  return (
    <Seccion id={id}>
      <div className="grid items-center gap-10 md:grid-cols-2">
        {imagen && (
          <Aparecer>
            <img src={imagen.src} alt={imagen.alt} className="aspect-[4/3] w-full rounded-xl object-cover" />
          </Aparecer>
        )}
        <Aparecer>
          <h2 className="text-3xl md:text-4xl">{texto(datos.titulo)}</h2>
          <p className="mt-4 whitespace-pre-line text-lg text-suave">{texto(datos.texto)}</p>
          <ul className="mt-6 grid gap-2">
            {lista<{ texto: string }>(datos.puntos).map((p, i) => (
              <li key={i} className="flex gap-2">
                <Check aria-hidden className="mt-1 size-4 text-exito" />
                {p.texto}
              </li>
            ))}
          </ul>
        </Aparecer>
      </div>
    </Seccion>
  );
}

/** Campos: titulo, miembros[{id, nombre, cargo, foto}] */
export function Equipo({ id = 'equipo', datos }: PropsBloque) {
  return (
    <Seccion id={id} titulo={texto(datos.titulo)} subtitulo={texto(datos.subtitulo)} fondo="superficie">
      <ul className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {lista<{ id?: string; nombre: string; cargo: string; foto?: unknown }>(datos.miembros).map((m, i) => {
          const foto = img(m.foto, m.nombre);
          return (
            <Aparecer as="li" key={m.id ?? i} className="text-center">
              {foto ? (
                <img
                  src={foto.src}
                  alt={foto.alt || m.nombre}
                  className="mx-auto aspect-square w-full max-w-40 rounded-full object-cover"
                />
              ) : (
                <div className="mx-auto aspect-square w-full max-w-40 rounded-full bg-borde" />
              )}
              <p className="mt-3 font-semibold">{m.nombre}</p>
              <p className="text-sm text-suave">{m.cargo}</p>
            </Aparecer>
          );
        })}
      </ul>
    </Seccion>
  );
}

/** Campos: titulo, items[{valor, etiqueta}] */
export function Cifras({ id = 'cifras', datos }: PropsBloque) {
  return (
    <Seccion id={id} titulo={texto(datos.titulo)}>
      <dl className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {lista<{ valor: string; etiqueta: string }>(datos.items).map((c, i) => (
          <Aparecer key={i} className="rounded-lg border border-borde p-6 text-center">
            <dt className="order-2 text-sm text-suave">{c.etiqueta}</dt>
            <dd className="text-4xl font-bold text-primario">{c.valor}</dd>
          </Aparecer>
        ))}
      </dl>
    </Seccion>
  );
}

/** Campos: titulo, logos[{nombre, imagen}] — clientes ficticios. */
export function Logos({ id = 'logos', datos }: PropsBloque) {
  return (
    <Seccion id={id} titulo={texto(datos.titulo)} className="py-10 md:py-14">
      <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 opacity-80">
        {lista<{ nombre: string; imagen?: unknown }>(datos.logos).map((l, i) => {
          const im = img(l.imagen, l.nombre);
          return (
            <li key={i}>
              {im ? (
                <img src={im.src} alt={im.alt || l.nombre} className="h-8 w-auto grayscale" />
              ) : (
                <span className="text-lg font-bold text-suave">{l.nombre}</span>
              )}
            </li>
          );
        })}
      </ul>
    </Seccion>
  );
}
