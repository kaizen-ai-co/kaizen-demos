'use client';

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { contraste } from '@kaizen/tema';
import { AvisoDemo, Boton, Insignia, Selector, cn } from '@kaizen/ui';
import { Eye, EyeOff, GripVertical, History, Laptop, LogOut, RotateCcw, Send, Smartphone } from 'lucide-react';
import * as React from 'react';
import {
  CLAVE_ESTRUCTURA,
  completarContenido,
  estructuraPorDefecto,
  type Contenido,
  type EsquemaContenido,
  type Estructura,
  type ValorImagen,
} from '../esquema';
import { validarContenido, type ErrorValidacion } from '../validar';
import { CamposAnidados, type ContextoEditor } from './controles';

/**
 * Editor /editar (igual para las seis plantillas).
 *
 *  ┌ barra: aviso demo · usuario/rol · estado de guardado · Volver atrás · Publicar ┐
 *  ├ panel izquierdo: Contenido | Estructura (solo Dev) | vistas extra (Leads…)     │
 *  └ panel derecho: vista previa en vivo del borrador (móvil / escritorio)          ┘
 *
 * Cada cambio se guarda como borrador (PUT {api}/borrador, con espera de 800 ms) y
 * recarga la vista previa. Publicar valida contra el esquema y se bloquea si falla.
 */

export interface VistaExtra {
  id: string;
  titulo: string;
  contenido: React.ReactNode;
}

export interface PropsEditor {
  /** Esquema YA filtrado por rol (lo hace el servidor). */
  esquema: EsquemaContenido;
  /** Esquema completo: se usa para validar igual que el servidor. */
  esquemaCompleto?: EsquemaContenido;
  inicial: Contenido;
  sitioId: string;
  usuario: { correo: string; nombre?: string; rol: 'desarrollador' | 'administrador' | 'cliente'; venceEl?: string };
  ultimaPublicacion?: { por?: string; el?: string } | null;
  api?: string;
  apiArchivos?: string;
  apiSesion?: string;
  urlVistaPrevia?: string;
  vistasExtra?: VistaExtra[];
}

type EstadoGuardado = 'sin-cambios' | 'pendiente' | 'guardando' | 'guardado' | 'error';

export function Editor({
  esquema,
  esquemaCompleto,
  inicial,
  sitioId,
  usuario,
  ultimaPublicacion,
  api = '/api/editor',
  apiArchivos = '/api/archivos',
  apiSesion = '/api/sesion',
  urlVistaPrevia = '/?vista=borrador',
  vistasExtra = [],
}: PropsEditor) {
  const esDev = usuario.rol === 'desarrollador';
  const rolEdicion = esDev ? 'desarrollador' : 'administrador';
  const [datos, setDatos] = React.useState<Contenido>(() => completarContenido(esquemaCompleto ?? esquema, inicial));
  const [guardado, setGuardado] = React.useState<EstadoGuardado>('sin-cambios');
  const [pestana, setPestana] = React.useState<string>('contenido');
  const [seccionAbierta, setSeccionAbierta] = React.useState<string | null>(esquema.secciones[0]?.id ?? null);
  const [dispositivo, setDispositivo] = React.useState<'movil' | 'escritorio'>('escritorio');
  const [recarga, setRecarga] = React.useState(0);
  const [mensaje, setMensaje] = React.useState<{ tono: 'exito' | 'peligro'; texto: string } | null>(null);
  const [publicacion, setPublicacion] = React.useState(ultimaPublicacion ?? null);
  const [historial, setHistorial] = React.useState<
    { id: string; publicadoPor?: string; publicadoEl?: string; estado: string }[] | null
  >(null);
  const temporizador = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const ultimoEnviado = React.useRef<string>(JSON.stringify(datos));

  const errores: ErrorValidacion[] = React.useMemo(
    () => validarContenido(esquemaCompleto ?? esquema, datos),
    [datos, esquema, esquemaCompleto],
  );
  const erroresPorSeccion = React.useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of errores) {
      const s = e.ruta.split('.')[0]!;
      m[s] = (m[s] ?? 0) + 1;
    }
    return m;
  }, [errores]);

  // ── Guardado automático del borrador ────────────────────────────────
  const guardar = React.useCallback(
    async (contenido: Contenido) => {
      const cuerpo = JSON.stringify({ datos: contenido });
      if (cuerpo === ultimoEnviado.current) return setGuardado('guardado');
      setGuardado('guardando');
      try {
        const r = await fetch(`${api}/borrador`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: cuerpo,
        });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? `Error ${r.status}`);
        ultimoEnviado.current = cuerpo;
        setGuardado('guardado');
        setRecarga((n) => n + 1);
      } catch (e) {
        setGuardado('error');
        setMensaje({ tono: 'peligro', texto: `No se guardó el borrador: ${(e as Error).message}` });
      }
    },
    [api],
  );

  const cambiar = React.useCallback(
    (siguiente: Contenido) => {
      setDatos(siguiente);
      setGuardado('pendiente');
      if (temporizador.current) clearTimeout(temporizador.current);
      temporizador.current = setTimeout(() => void guardar(siguiente), 800);
    },
    [guardar],
  );

  // Aviso al salir con cambios sin guardar.
  React.useEffect(() => {
    const antes = (e: BeforeUnloadEvent) => {
      if (guardado === 'pendiente' || guardado === 'guardando') e.preventDefault();
    };
    window.addEventListener('beforeunload', antes);
    return () => window.removeEventListener('beforeunload', antes);
  }, [guardado]);

  // ── Acciones ───────────────────────────────────────────────────────
  async function publicar() {
    if (errores.length) {
      setMensaje({ tono: 'peligro', texto: `Corrige ${errores.length} error(es) antes de publicar.` });
      const primero = errores[0]!.ruta.split('.')[0]!;
      setPestana('contenido');
      setSeccionAbierta(primero);
      return;
    }
    if (temporizador.current) clearTimeout(temporizador.current);
    await guardar(datos);
    const r = await fetch(`${api}/publicar`, { method: 'POST' });
    const cuerpo = await r.json().catch(() => ({}));
    if (!r.ok) {
      setMensaje({ tono: 'peligro', texto: cuerpo.error ?? 'No se pudo publicar.' });
      return;
    }
    setPublicacion({ por: cuerpo.publicadoPor, el: cuerpo.publicadoEl });
    setGuardado('sin-cambios');
    setHistorial(null);
    setMensaje({ tono: 'exito', texto: 'Publicado. La página pública ya muestra estos cambios.' });
  }

  async function volverAtras() {
    if (!confirm('¿Restaurar la versión publicada anterior? Lo publicado ahora queda guardado en el historial.'))
      return;
    const r = await fetch(`${api}/volver`, { method: 'POST' });
    const cuerpo = await r.json().catch(() => ({}));
    if (!r.ok) return setMensaje({ tono: 'peligro', texto: cuerpo.error ?? 'No hay una versión anterior.' });
    const restaurado = completarContenido(esquemaCompleto ?? esquema, cuerpo.datos);
    setDatos(restaurado);
    ultimoEnviado.current = JSON.stringify({ datos: restaurado });
    setPublicacion({ por: cuerpo.publicadoPor, el: cuerpo.publicadoEl });
    setRecarga((n) => n + 1);
    setHistorial(null);
    setMensaje({ tono: 'exito', texto: 'Se restauró la versión anterior.' });
  }

  async function verHistorial() {
    const r = await fetch(`${api}/historial`);
    setHistorial(r.ok ? await r.json() : []);
  }

  async function salir() {
    await fetch(apiSesion, { method: 'DELETE' });
    window.location.reload();
  }

  const contexto: ContextoEditor = {
    sitioId,
    contenido: datos,
    rol: rolEdicion,
    subirArchivo: async (archivo: File, carpeta = 'archivos'): Promise<ValorImagen> => {
      const fd = new FormData();
      fd.append('archivo', archivo);
      fd.append('carpeta', carpeta);
      const r = await fetch(apiArchivos, { method: 'POST', body: fd });
      const cuerpo = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(cuerpo.error ?? 'No se pudo subir el archivo.');
      return { url: cuerpo.url, ruta: cuerpo.ruta, bytes: cuerpo.bytes };
    },
  };

  const estructura: Estructura = datos[CLAVE_ESTRUCTURA] ?? estructuraPorDefecto(esquemaCompleto ?? esquema);
  const pestanas = [
    { id: 'contenido', titulo: 'Contenido' },
    ...(esDev ? [{ id: 'estructura', titulo: 'Estructura' }] : []),
    ...vistasExtra.map((v) => ({ id: v.id, titulo: v.titulo })),
  ];
  const textoGuardado: Record<EstadoGuardado, string> = {
    'sin-cambios': 'Sin cambios',
    pendiente: 'Cambios sin guardar',
    guardando: 'Guardando…',
    guardado: 'Borrador guardado',
    error: 'Error al guardar',
  };

  return (
    <div className="flex h-dvh flex-col bg-superficie text-texto">
      <AvisoDemo />
      <header className="flex flex-wrap items-center gap-3 border-b border-borde bg-fondo px-4 py-2">
        <strong className="mr-2">{esquema.titulo}</strong>
        <Insignia tono={esDev ? 'primario' : 'neutro'}>
          {usuario.rol === 'desarrollador' ? 'Desarrollador' : usuario.rol === 'cliente' ? 'Cliente' : 'Administrador'}
        </Insignia>
        {usuario.rol === 'cliente' && usuario.venceEl && (
          <span className="text-xs text-suave">
            Prueba hasta {new Date(usuario.venceEl).toLocaleDateString('es-CO')}
          </span>
        )}
        <span aria-live="polite" className={cn('text-xs', guardado === 'error' ? 'text-peligro' : 'text-suave')}>
          {textoGuardado[guardado]}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {publicacion?.el && (
            <span className="hidden text-xs text-suave lg:inline">
              Publicado {new Date(publicacion.el).toLocaleString('es-CO')}
              {publicacion.por ? ` por ${publicacion.por}` : ''}
            </span>
          )}
          <Boton variante="fantasma" tamano="sm" onClick={verHistorial}>
            <History aria-hidden /> Historial
          </Boton>
          <Boton variante="borde" tamano="sm" onClick={volverAtras}>
            <RotateCcw aria-hidden /> Volver atrás
          </Boton>
          <Boton
            tamano="sm"
            onClick={publicar}
            aria-disabled={errores.length > 0}
            className={cn(errores.length > 0 && 'opacity-60')}
            title={errores.length ? `${errores.length} error(es) bloquean la publicación` : 'Publicar borrador'}
          >
            <Send aria-hidden /> Publicar{errores.length ? ` (${errores.length})` : ''}
          </Boton>
          <Boton
            variante="fantasma"
            tamano="icono"
            aria-label={`Salir (${usuario.correo})`}
            title={usuario.correo}
            onClick={salir}
          >
            <LogOut />
          </Boton>
        </div>
      </header>

      {mensaje && (
        <div
          role={mensaje.tono === 'peligro' ? 'alert' : 'status'}
          className={cn(
            'flex items-center justify-between px-4 py-2 text-sm',
            mensaje.tono === 'exito' ? 'bg-exito/15' : 'bg-peligro/15',
          )}
        >
          {mensaje.texto}
          <button className="text-xs underline" onClick={() => setMensaje(null)}>
            Cerrar
          </button>
        </div>
      )}

      {historial && (
        <div className="border-b border-borde bg-fondo px-4 py-3 text-sm">
          <div className="mb-2 flex items-center justify-between">
            <strong>Historial de publicaciones</strong>
            <button className="text-xs underline" onClick={() => setHistorial(null)}>
              Cerrar
            </button>
          </div>
          {historial.length === 0 ? (
            <p className="text-suave">Todavía no hay publicaciones.</p>
          ) : (
            <ol className="grid gap-1">
              {historial.map((h) => (
                <li key={h.id} className="flex gap-3">
                  <Insignia tono={h.estado === 'publicado' ? 'exito' : 'neutro'}>{h.estado}</Insignia>
                  {h.publicadoEl && new Date(h.publicadoEl).toLocaleString('es-CO')} · {h.publicadoPor}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      <div
        id="contenido"
        tabIndex={-1}
        className="grid min-h-0 flex-1 outline-none lg:grid-cols-[minmax(22rem,30rem)_1fr]"
      >
        {/* Panel de edición */}
        <aside className="flex min-h-0 flex-col border-r border-borde bg-fondo">
          <div
            role="tablist"
            aria-label="Paneles del editor"
            className="flex gap-1 overflow-x-auto border-b border-borde px-2"
          >
            {pestanas.map((p) => (
              <button
                key={p.id}
                role="tab"
                aria-selected={pestana === p.id}
                onClick={() => setPestana(p.id)}
                className={cn(
                  'whitespace-nowrap border-b-2 px-3 py-2 text-sm',
                  pestana === p.id ? 'border-primario font-semibold' : 'border-transparent text-suave',
                )}
              >
                {p.titulo}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4" role="tabpanel">
            {pestana === 'contenido' && (
              <div className="grid gap-3">
                {esquema.secciones.map((s) => {
                  const oculta = estructura.ocultas.includes(s.id);
                  const abierta = seccionAbierta === s.id;
                  return (
                    <section key={s.id} className={cn('rounded-lg border border-borde', oculta && 'opacity-60')}>
                      <button
                        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
                        aria-expanded={abierta}
                        onClick={() => setSeccionAbierta(abierta ? null : s.id)}
                      >
                        <span className="font-semibold">
                          {s.titulo}
                          {oculta && <span className="ml-2 text-xs font-normal text-suave">(oculta)</span>}
                        </span>
                        {erroresPorSeccion[s.id] ? (
                          <Insignia tono="peligro">{erroresPorSeccion[s.id]} error(es)</Insignia>
                        ) : null}
                      </button>
                      {abierta && (
                        <div className="border-t border-borde p-4">
                          {s.descripcion && <p className="mb-4 text-sm text-suave">{s.descripcion}</p>}
                          <CamposAnidados
                            campos={s.campos}
                            valor={(datos[s.id] ?? {}) as Record<string, unknown>}
                            ruta={s.id}
                            errores={errores}
                            contexto={contexto}
                            alCambiar={(v) => cambiar({ ...datos, [s.id]: v })}
                          />
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}

            {pestana === 'estructura' && esDev && (
              <PanelEstructura
                esquema={esquemaCompleto ?? esquema}
                estructura={estructura}
                alCambiar={(e) => cambiar({ ...datos, [CLAVE_ESTRUCTURA]: e })}
              />
            )}

            {vistasExtra.map((v) => pestana === v.id && <div key={v.id}>{v.contenido}</div>)}
          </div>
        </aside>

        {/* Vista previa en vivo */}
        <section aria-label="Vista previa" className="hidden min-h-0 flex-col lg:flex">
          <div className="flex items-center justify-center gap-2 border-b border-borde bg-fondo py-2">
            <Boton
              variante={dispositivo === 'movil' ? 'secundario' : 'fantasma'}
              tamano="sm"
              aria-pressed={dispositivo === 'movil'}
              onClick={() => setDispositivo('movil')}
            >
              <Smartphone aria-hidden /> Móvil
            </Boton>
            <Boton
              variante={dispositivo === 'escritorio' ? 'secundario' : 'fantasma'}
              tamano="sm"
              aria-pressed={dispositivo === 'escritorio'}
              onClick={() => setDispositivo('escritorio')}
            >
              <Laptop aria-hidden /> Escritorio
            </Boton>
            <a href="/" target="_blank" rel="noreferrer" className="ml-4 text-xs underline">
              Abrir página pública
            </a>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-4">
            <iframe
              key={recarga}
              title="Vista previa del borrador"
              src={urlVistaPrevia}
              className={cn(
                'mx-auto h-full rounded-lg border border-borde bg-white shadow-md transition-all',
                dispositivo === 'movil' ? 'w-[390px]' : 'w-full',
              )}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

// ── Panel de estructura (solo Desarrollador) ──────────────────────────

function FilaSeccion({
  id,
  titulo,
  oculta,
  activable,
  variantes,
  variante,
  alOcultar,
  alVariante,
}: {
  id: string;
  titulo: string;
  oculta: boolean;
  activable: boolean;
  variantes?: string[];
  variante?: string;
  alOcultar: () => void;
  alVariante: (v: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-center gap-2 rounded-md border border-borde bg-fondo p-2"
    >
      <button
        type="button"
        className="cursor-grab touch-none p-1 text-suave"
        aria-label={`Mover ${titulo}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <span className={cn('flex-1 text-sm', oculta && 'text-suave line-through')}>{titulo}</span>
      {variantes && variantes.length > 1 && (
        <Selector
          aria-label={`Variante de ${titulo}`}
          className="h-8 w-36 text-xs"
          value={variante ?? variantes[0]}
          onChange={(e) => alVariante(e.target.value)}
        >
          {variantes.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </Selector>
      )}
      {activable && (
        <Boton
          variante="fantasma"
          tamano="icono"
          aria-label={oculta ? `Mostrar ${titulo}` : `Ocultar ${titulo}`}
          onClick={alOcultar}
        >
          {oculta ? <EyeOff /> : <Eye />}
        </Boton>
      )}
    </li>
  );
}

const COLORES_EDITABLES = ['primario', 'primarioTexto', 'acento', 'acentoTexto', 'fondo', 'texto'] as const;

function PanelEstructura({
  esquema,
  estructura,
  alCambiar,
}: {
  esquema: EsquemaContenido;
  estructura: Estructura;
  alCambiar: (e: Estructura) => void;
}) {
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const alSoltar = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    alCambiar({
      ...estructura,
      orden: arrayMove(
        estructura.orden,
        estructura.orden.indexOf(String(e.active.id)),
        estructura.orden.indexOf(String(e.over.id)),
      ),
    });
  };
  const colores = estructura.tema?.colores ?? {};
  const par = (a: string, b: string) => (colores[a] && colores[b] ? contraste(colores[a]!, colores[b]!) : null);

  return (
    <div className="grid gap-6">
      <div>
        <h3 className="mb-1 text-sm font-semibold">Orden, visibilidad y variantes</h3>
        <p className="mb-3 text-xs text-suave">
          Arrastra para reordenar. El ojo oculta secciones activables. La variante cambia el diseño del bloque.
        </p>
        <DndContext sensors={sensores} collisionDetection={closestCenter} onDragEnd={alSoltar}>
          <SortableContext items={estructura.orden} strategy={verticalListSortingStrategy}>
            <ul className="grid gap-2">
              {estructura.orden.map((id) => {
                const s = esquema.secciones.find((x) => x.id === id);
                if (!s) return null;
                const oculta = estructura.ocultas.includes(id);
                return (
                  <FilaSeccion
                    key={id}
                    id={id}
                    titulo={s.titulo}
                    oculta={oculta}
                    activable={!!s.activable}
                    variantes={s.variantes}
                    variante={estructura.variantes[id]}
                    alOcultar={() =>
                      alCambiar({
                        ...estructura,
                        ocultas: oculta ? estructura.ocultas.filter((x) => x !== id) : [...estructura.ocultas, id],
                      })
                    }
                    alVariante={(v) => alCambiar({ ...estructura, variantes: { ...estructura.variantes, [id]: v } })}
                  />
                );
              })}
            </ul>
          </SortableContext>
        </DndContext>
      </div>

      <div>
        <h3 className="mb-1 text-sm font-semibold">Colores de esta demo</h3>
        <p className="mb-3 text-xs text-suave">
          Vacío = usa el tema base (tema.json). Revisa el contraste: mínimo 4.5:1.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {COLORES_EDITABLES.map((k) => (
            <label key={k} className="grid gap-1 text-xs">
              {k}
              <span className="flex items-center gap-2">
                <input
                  type="color"
                  value={colores[k] ?? '#ffffff'}
                  onChange={(e) =>
                    alCambiar({
                      ...estructura,
                      tema: { ...estructura.tema, colores: { ...colores, [k]: e.target.value } },
                    })
                  }
                  className="h-8 w-10 rounded border border-borde"
                />
                <span className="font-mono">{colores[k] ?? '—'}</span>
              </span>
            </label>
          ))}
        </div>
        <ul className="mt-3 grid gap-1 text-xs">
          {(
            [
              ['primarioTexto', 'primario'],
              ['acentoTexto', 'acento'],
              ['texto', 'fondo'],
            ] as const
          ).map(([a, b]) => {
            const v = par(a, b);
            return v === null ? null : (
              <li key={a} className={v < 4.5 ? 'text-peligro' : 'text-exito'}>
                {a} sobre {b}: {v}:1 {v < 4.5 ? '— no pasa AA' : '— pasa AA'}
              </li>
            );
          })}
        </ul>
        {estructura.tema?.colores && Object.keys(estructura.tema.colores).length > 0 && (
          <Boton
            variante="enlace"
            tamano="sm"
            className="mt-2 px-0"
            onClick={() => alCambiar({ ...estructura, tema: undefined })}
          >
            Volver al tema base
          </Boton>
        )}
      </div>
    </div>
  );
}
