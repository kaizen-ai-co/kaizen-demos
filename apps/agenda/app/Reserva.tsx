'use client';

import { Aviso, Boton, CampoFormulario, Entrada, Tarjeta, cn, formatearPrecio } from '@kaizen/ui';
import { CalendarCheck, ChevronLeft } from 'lucide-react';
import * as React from 'react';

interface Servicio { id: string; nombre: string; descripcion?: string; duracionMin: number; precio?: number }
interface Profesional { id: string; nombre: string; cargo?: string; foto: string | null; servicios: string[] }
interface Hueco { profesionalId: string; inicio: string; fin: string }
interface Textos { textoBoton: string; tituloConfirmacion: string; textoConfirmacion: string; textoOcupado: string; politicaCancelacion: string }

const ZONA = 'America/Bogota';
const hoyBogota = () => new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(new Date());
const sumarDias = (f: string, n: number) => {
  const [a, m, d] = f.split('-').map(Number);
  return new Date(Date.UTC(a!, m! - 1, d! + n)).toISOString().slice(0, 10);
};
const etiquetaDia = (f: string) => {
  const [a, m, d] = f.split('-').map(Number);
  const fecha = new Date(Date.UTC(a!, m! - 1, d!, 12));
  return {
    dia: new Intl.DateTimeFormat('es-CO', { weekday: 'short', timeZone: 'UTC' }).format(fecha),
    num: new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(fecha),
    largo: new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(fecha),
  };
};
const hora = (iso: string) => new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit', timeZone: ZONA }).format(new Date(iso));

const PASOS = ['Servicio', 'Profesional', 'Hora', 'Tus datos'];

/** Flujo de reserva: servicio → profesional → hora → datos. El servidor valida el hueco otra vez al confirmar. */
export function Reserva({ servicios, profesionales, diasAdelante, textos }: { servicios: Servicio[]; profesionales: Profesional[]; diasAdelante: number; textos: Textos }) {
  const [paso, setPaso] = React.useState(0);
  const [servicio, setServicio] = React.useState<Servicio | null>(null);
  const [profesionalId, setProfesionalId] = React.useState<string>('cualquiera');
  const [fecha, setFecha] = React.useState<string>(hoyBogota());
  const [huecos, setHuecos] = React.useState<Hueco[] | null>(null);
  const [cargando, setCargando] = React.useState(false);
  const [hueco, setHueco] = React.useState<Hueco | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [errores, setErrores] = React.useState<Record<string, string>>({});
  const [enviando, setEnviando] = React.useState(false);
  const [confirmada, setConfirmada] = React.useState<{ inicio: string; profesional: string; nombre: string } | null>(null);
  const tituloRef = React.useRef<HTMLHeadingElement>(null);

  const dias = React.useMemo(() => Array.from({ length: diasAdelante + 1 }, (_, i) => sumarDias(hoyBogota(), i)), [diasAdelante]);
  const candidatos = servicio ? profesionales.filter((p) => !p.servicios.length || p.servicios.includes(servicio.id)) : [];
  const nombreProf = (id: string) => profesionales.find((p) => p.id === id)?.nombre ?? id;

  React.useEffect(() => tituloRef.current?.focus(), [paso]);

  const cargarHuecos = React.useCallback(async (f: string) => {
    if (!servicio) return;
    setCargando(true);
    setError(null);
    setHuecos(null);
    const q = new URLSearchParams({ servicio: servicio.id, profesional: profesionalId, fecha: f });
    const r = await fetch(`/api/huecos?${q}`);
    const c = await r.json().catch(() => ({}));
    setCargando(false);
    if (!r.ok) return setError(c.error ?? 'No pudimos cargar los horarios.');
    setHuecos(c.huecos);
  }, [servicio, profesionalId]);

  React.useEffect(() => {
    if (paso === 2) void cargarHuecos(fecha);
  }, [paso, fecha, cargarHuecos]);

  async function confirmar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!servicio || !hueco) return;
    const d = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
    const errs: Record<string, string> = {};
    if (!d.nombre?.trim()) errs.nombre = 'Escribe tu nombre.';
    if (!d.telefono?.trim() && !d.correo?.trim()) errs.telefono = 'Deja un teléfono o un correo.';
    if (d.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.correo)) errs.correo = 'Revisa el correo.';
    setErrores(errs);
    if (Object.keys(errs).length) return;
    setEnviando(true);
    setError(null);
    const r = await fetch('/api/citas', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ servicioId: servicio.id, profesionalId: hueco.profesionalId, inicio: hueco.inicio, ...d }),
    });
    const c = await r.json().catch(() => ({}));
    setEnviando(false);
    if (r.status === 409) {
      setHueco(null);
      setHuecos(c.alternativas ?? []);
      setError(textos.textoOcupado);
      setPaso(2);
      return;
    }
    if (!r.ok) return setError(c.error ?? 'No pudimos reservar.');
    setConfirmada({ inicio: hueco.inicio, profesional: nombreProf(hueco.profesionalId), nombre: d.nombre! });
  }

  if (confirmada && servicio) {
    return (
      <Tarjeta className="text-center" role="status">
        <CalendarCheck aria-hidden className="mx-auto size-10 text-exito" />
        <h2 className="mt-3 text-2xl">{textos.tituloConfirmacion}</h2>
        <dl className="mx-auto mt-4 grid max-w-sm gap-1 text-left text-sm">
          <div className="flex justify-between gap-4"><dt className="text-suave">Servicio</dt><dd>{servicio.nombre}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-suave">Con</dt><dd>{confirmada.profesional}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-suave">Día</dt><dd>{etiquetaDia(confirmada.inicio.slice(0, 10)).largo}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-suave">Hora</dt><dd>{hora(confirmada.inicio)}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-suave">A nombre de</dt><dd>{confirmada.nombre}</dd></div>
        </dl>
        {textos.textoConfirmacion && <p className="mt-4 text-sm text-suave">{textos.textoConfirmacion}</p>}
        {textos.politicaCancelacion && <p className="mt-2 text-xs text-suave">{textos.politicaCancelacion}</p>}
        <Boton variante="borde" className="mt-6" onClick={() => { setConfirmada(null); setHueco(null); setServicio(null); setPaso(0); }}>Reservar otra cita</Boton>
      </Tarjeta>
    );
  }

  return (
    <div className="grid gap-4">
      <ol className="grid grid-cols-4 gap-1 text-center text-xs" aria-label="Pasos de la reserva">
        {PASOS.map((p, i) => (
          <li key={p} aria-current={i === paso ? 'step' : undefined} className={cn('rounded-full border px-2 py-1', i === paso ? 'border-primario bg-primario text-primario-texto' : i < paso ? 'border-primario text-primario' : 'border-borde text-suave')}>
            {i + 1}. {p}
          </li>
        ))}
      </ol>

      <Tarjeta className="p-5">
        {paso > 0 && (
          <button type="button" className="mb-3 inline-flex items-center gap-1 text-sm text-suave hover:text-texto" onClick={() => { setError(null); setPaso(paso - 1); }}>
            <ChevronLeft aria-hidden className="size-4" /> Atrás
          </button>
        )}
        <h2 ref={tituloRef} tabIndex={-1} className="mb-4 text-xl outline-none">
          {['¿Qué servicio necesitas?', '¿Con quién?', '¿Qué día y a qué hora?', 'Tus datos'][paso]}
        </h2>

        {paso === 0 && (
          <ul className="grid gap-3">
            {servicios.map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => { setServicio(s); setProfesionalId('cualquiera'); setHueco(null); setPaso(1); }} className="flex w-full items-center justify-between gap-3 rounded-lg border border-borde p-4 text-left hover:border-primario">
                  <span>
                    <span className="block font-semibold">{s.nombre}</span>
                    <span className="block text-sm text-suave">{s.descripcion} · {s.duracionMin} min</span>
                  </span>
                  <span className="text-sm font-semibold">{s.precio ? formatearPrecio(s.precio) : 'Sin costo'}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {paso === 1 && (
          <ul className="grid gap-3 sm:grid-cols-2">
            {[{ id: 'cualquiera', nombre: 'Cualquier profesional', cargo: 'La primera hora disponible', foto: null }, ...candidatos].map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => { setProfesionalId(p.id); setHueco(null); setPaso(2); }} className="flex w-full items-center gap-3 rounded-lg border border-borde p-4 text-left hover:border-primario">
                  {p.foto ? <img src={p.foto} alt="" className="size-12 rounded-full object-cover" /> : <span aria-hidden className="flex size-12 items-center justify-center rounded-full bg-secundario font-bold text-secundario-texto">{p.nombre.charAt(0)}</span>}
                  <span><span className="block font-semibold">{p.nombre}</span>{p.cargo && <span className="block text-sm text-suave">{p.cargo}</span>}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {paso === 2 && (
          <div className="grid gap-4">
            <div className="flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Día">
              {dias.map((d) => {
                const e = etiquetaDia(d);
                return (
                  <button key={d} type="button" aria-pressed={d === fecha} aria-label={e.largo} onClick={() => { setFecha(d); setHueco(null); setError(null); }} className={cn('min-w-16 shrink-0 rounded-lg border px-2 py-2 text-center text-xs', d === fecha ? 'border-primario bg-primario text-primario-texto' : 'border-borde')}>
                    <span className="block capitalize">{e.dia}</span><span className="block font-semibold">{e.num}</span>
                  </button>
                );
              })}
            </div>
            {error && <Aviso tono="aviso">{error}</Aviso>}
            <div aria-live="polite">
              {cargando && <p className="text-sm text-suave">Buscando horarios…</p>}
              {huecos && huecos.length === 0 && <p className="text-sm text-suave">No hay horarios disponibles este día. Prueba otro.</p>}
              {huecos && huecos.length > 0 && (
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {huecos.map((h) => (
                    <li key={h.profesionalId + h.inicio}>
                      <button type="button" onClick={() => { setHueco(h); setError(null); setPaso(3); }} className="w-full rounded-md border border-borde px-2 py-2 text-sm hover:border-primario">
                        {hora(h.inicio)}
                        {profesionalId === 'cualquiera' && <span className="block truncate text-[11px] text-suave">{nombreProf(h.profesionalId)}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {paso === 3 && hueco && servicio && (
          <form onSubmit={confirmar} noValidate className="grid gap-4">
            <p className="rounded-md bg-superficie p-3 text-sm">
              {servicio.nombre} con <strong>{nombreProf(hueco.profesionalId)}</strong> · {etiquetaDia(hueco.inicio.slice(0, 10)).largo}, {hora(hueco.inicio)}
            </p>
            <CampoFormulario id="r-nombre" etiqueta="Nombre" requerido error={errores.nombre}><Entrada name="nombre" autoComplete="name" placeholder="Nombre ficticio" /></CampoFormulario>
            <CampoFormulario id="r-telefono" etiqueta="Teléfono o WhatsApp" error={errores.telefono}><Entrada name="telefono" type="tel" inputMode="tel" autoComplete="tel" placeholder="300 000 0000" /></CampoFormulario>
            <CampoFormulario id="r-correo" etiqueta="Correo (opcional)" error={errores.correo}><Entrada name="correo" type="email" autoComplete="email" placeholder="nombre@ejemplo.test" /></CampoFormulario>
            <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
              <label>No llenar<input type="text" name="_trampa" tabIndex={-1} autoComplete="off" /></label>
            </div>
            {textos.politicaCancelacion && <p className="text-xs text-suave">{textos.politicaCancelacion}</p>}
            {error && <Aviso tono="peligro">{error}</Aviso>}
            <Boton type="submit" tamano="lg" disabled={enviando}>{enviando ? 'Reservando…' : textos.textoBoton}</Boton>
            <p className="text-xs text-suave">Demo con datos ficticios: no escribas datos personales reales. No se envían correos ni mensajes.</p>
          </form>
        )}
      </Tarjeta>
    </div>
  );
}
