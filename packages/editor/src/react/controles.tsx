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
import { AreaTexto, Boton, Entrada, Etiqueta, NOMBRES_ICONOS, Selector, cn } from '@kaizen/ui';
import { ChevronDown, GripVertical, Plus, Trash2, Upload } from 'lucide-react';
import * as React from 'react';
import { normalizarOpciones, objetoPorDefecto, slug, type Campo, type ValorImagen } from '../esquema';
import type { ErrorValidacion } from '../validar';

/**
 * Controles del formulario generado. Cada tipo de campo tiene un control.
 * Las plantillas suman tipos propios con:
 *
 *   registrarControl('horarioSemanal', ControlHorario)
 *
 * (en un archivo 'use client' importado por la página /editar de la app).
 */

export interface ContextoEditor {
  sitioId: string;
  /** Sube un archivo y devuelve su ruta/url. */
  subirArchivo: (archivo: File, carpeta?: string) => Promise<ValorImagen>;
  /** Contenido completo actual (para controles que dependen de otras secciones). */
  contenido: Record<string, unknown>;
  rol: 'administrador' | 'desarrollador';
}

export interface PropsControl<V = unknown> {
  campo: Campo;
  valor: V;
  alCambiar: (v: V) => void;
  ruta: string;
  errores: ErrorValidacion[];
  contexto: ContextoEditor;
}

export type Control = React.ComponentType<PropsControl<any>>;

const registro = new Map<string, Control>();

export function registrarControl(tipo: string, control: Control) {
  registro.set(tipo, control);
}

export function obtenerControl(tipo: string): Control {
  return registro.get(tipo) ?? ControlTexto;
}

const idDe = (ruta: string) => `campo-${ruta.replace(/\./g, '-')}`;
const errorDe = (errores: ErrorValidacion[], ruta: string) => errores.find((e) => e.ruta === ruta)?.mensaje;

/** Envoltorio común: etiqueta, ayuda, contador y error accesibles. */
export function Envoltorio({
  campo,
  ruta,
  errores,
  children,
  contador,
}: {
  campo: Campo;
  ruta: string;
  errores: ErrorValidacion[];
  children: React.ReactNode;
  contador?: string;
}) {
  const error = errorDe(errores, ruta);
  return (
    <div className="grid gap-1.5" data-ruta={ruta}>
      <div className="flex items-baseline justify-between gap-2">
        <Etiqueta htmlFor={idDe(ruta)}>
          {campo.etiqueta}{' '}
          {campo.requerido && (
            <span className="text-peligro" aria-hidden>
              *
            </span>
          )}
          {campo.rol === 'desarrollador' && (
            <span className="ml-2 rounded bg-secundario px-1.5 py-0.5 text-[10px] uppercase text-secundario-texto">
              Dev
            </span>
          )}
        </Etiqueta>
        {contador && <span className="text-xs tabular-nums text-suave">{contador}</span>}
      </div>
      {children}
      {campo.ayuda && <p className="text-xs text-suave">{campo.ayuda}</p>}
      {error && (
        <p role="alert" className="text-xs font-medium text-peligro">
          {error}
        </p>
      )}
    </div>
  );
}

function ControlTexto({ campo, valor, alCambiar, ruta, errores }: PropsControl<string>) {
  const v = typeof valor === 'string' ? valor : '';
  const tipoInput =
    campo.tipo === 'correo'
      ? 'email'
      : campo.tipo === 'telefono'
        ? 'tel'
        : campo.tipo === 'enlace'
          ? 'url'
          : campo.tipo === 'fecha'
            ? 'date'
            : campo.tipo === 'hora'
              ? 'time'
              : 'text';
  return (
    <Envoltorio
      campo={campo}
      ruta={ruta}
      errores={errores}
      contador={campo.max ? `${v.length}/${campo.max}` : undefined}
    >
      <Entrada
        id={idDe(ruta)}
        type={tipoInput}
        value={v}
        placeholder={campo.placeholder}
        aria-invalid={!!errorDe(errores, ruta)}
        onChange={(e) => alCambiar(e.target.value)}
      />
    </Envoltorio>
  );
}

function ControlTextoLargo({ campo, valor, alCambiar, ruta, errores }: PropsControl<string>) {
  const v = typeof valor === 'string' ? valor : '';
  return (
    <Envoltorio
      campo={campo}
      ruta={ruta}
      errores={errores}
      contador={campo.max ? `${v.length}/${campo.max}` : undefined}
    >
      <AreaTexto
        id={idDe(ruta)}
        value={v}
        rows={4}
        placeholder={campo.placeholder}
        aria-invalid={!!errorDe(errores, ruta)}
        onChange={(e) => alCambiar(e.target.value)}
      />
    </Envoltorio>
  );
}

function ControlNumero({ campo, valor, alCambiar, ruta, errores }: PropsControl<number>) {
  const esPorcentaje = campo.tipo === 'porcentaje';
  const mostrado = typeof valor === 'number' ? (esPorcentaje ? Math.round(valor * 10000) / 100 : valor) : '';
  return (
    <Envoltorio campo={campo} ruta={ruta} errores={errores}>
      <div className="flex items-center gap-2">
        {campo.tipo === 'precio' && <span className="text-sm text-suave">$</span>}
        <Entrada
          id={idDe(ruta)}
          type="number"
          inputMode="decimal"
          value={mostrado}
          step={campo.paso ?? (esPorcentaje ? 0.5 : 1)}
          min={esPorcentaje ? 0 : campo.min}
          max={esPorcentaje ? 100 : campo.max}
          aria-invalid={!!errorDe(errores, ruta)}
          onChange={(e) => {
            const n = e.target.value === '' ? 0 : Number(e.target.value);
            alCambiar(esPorcentaje ? n / 100 : n);
          }}
        />
        {esPorcentaje && <span className="text-sm text-suave">%</span>}
      </div>
    </Envoltorio>
  );
}

function ControlBooleano({ campo, valor, alCambiar, ruta, errores }: PropsControl<boolean>) {
  return (
    <div className="grid gap-1">
      <label className="flex items-center gap-3 text-sm font-medium">
        <input
          type="checkbox"
          className="size-4 accent-[var(--k-primario)]"
          checked={!!valor}
          onChange={(e) => alCambiar(e.target.checked)}
        />
        {campo.etiqueta}
        {campo.rol === 'desarrollador' && (
          <span className="rounded bg-secundario px-1.5 py-0.5 text-[10px] uppercase text-secundario-texto">Dev</span>
        )}
      </label>
      {campo.ayuda && <p className="pl-7 text-xs text-suave">{campo.ayuda}</p>}
      {errorDe(errores, ruta) && <p className="pl-7 text-xs text-peligro">{errorDe(errores, ruta)}</p>}
    </div>
  );
}

function ControlSeleccion({ campo, valor, alCambiar, ruta, errores, contexto }: PropsControl<string>) {
  // `props.opcionesDesde: "seccion.lista.campo"` toma las opciones de otra parte del contenido
  // (p. ej. responsables o categorías), para que el Administrador no las escriba dos veces.
  const desde = campo.props?.opcionesDesde as string | undefined;
  const opciones = desde ? opcionesDesdeContenido(contexto.contenido, desde) : normalizarOpciones(campo.opciones);
  return (
    <Envoltorio campo={campo} ruta={ruta} errores={errores}>
      <Selector id={idDe(ruta)} value={valor ?? ''} onChange={(e) => alCambiar(e.target.value)}>
        {!campo.requerido && <option value="">—</option>}
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.etiqueta}
          </option>
        ))}
      </Selector>
    </Envoltorio>
  );
}

function ControlMultiseleccion({ campo, valor, alCambiar, ruta, errores, contexto }: PropsControl<string[]>) {
  const desde = campo.props?.opcionesDesde as string | undefined;
  const opciones = desde ? opcionesDesdeContenido(contexto.contenido, desde) : normalizarOpciones(campo.opciones);
  const actual = Array.isArray(valor) ? valor : [];
  return (
    <Envoltorio campo={campo} ruta={ruta} errores={errores}>
      <div className="flex flex-wrap gap-2" role="group" aria-label={campo.etiqueta}>
        {opciones.map((o) => {
          const activo = actual.includes(o.valor);
          return (
            <button
              key={o.valor}
              type="button"
              aria-pressed={activo}
              onClick={() => alCambiar(activo ? actual.filter((x) => x !== o.valor) : [...actual, o.valor])}
              className={cn(
                'rounded-full border px-3 py-1 text-xs',
                activo ? 'border-primario bg-primario text-primario-texto' : 'border-borde',
              )}
            >
              {o.etiqueta}
            </button>
          );
        })}
      </div>
    </Envoltorio>
  );
}

export function opcionesDesdeContenido(contenido: Record<string, unknown>, ruta: string) {
  // "equipo.responsables.nombre" → lista en equipo.responsables, etiqueta = nombre, valor = id
  const partes = ruta.split('.');
  const campoEtiqueta = partes.pop()!;
  const listaValores = partes.reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], contenido);
  return (Array.isArray(listaValores) ? listaValores : []).map((x: Record<string, unknown>) => ({
    valor: String(x.id ?? x[campoEtiqueta] ?? ''),
    etiqueta: String(x[campoEtiqueta] ?? x.id ?? ''),
  }));
}

function ControlColor({ campo, valor, alCambiar, ruta, errores }: PropsControl<string>) {
  const v = typeof valor === 'string' && valor ? valor : '#000000';
  return (
    <Envoltorio campo={campo} ruta={ruta} errores={errores}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${campo.etiqueta} (selector)`}
          value={v}
          onChange={(e) => alCambiar(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded border border-borde bg-transparent"
        />
        <Entrada
          id={idDe(ruta)}
          value={valor ?? ''}
          onChange={(e) => alCambiar(e.target.value)}
          className="font-mono"
          maxLength={7}
        />
      </div>
    </Envoltorio>
  );
}

function ControlIcono({ campo, valor, alCambiar, ruta, errores }: PropsControl<string>) {
  return (
    <Envoltorio campo={campo} ruta={ruta} errores={errores}>
      <Selector id={idDe(ruta)} value={valor ?? ''} onChange={(e) => alCambiar(e.target.value)}>
        <option value="">(por defecto)</option>
        {NOMBRES_ICONOS.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </Selector>
    </Envoltorio>
  );
}

/** Imagen o modelo 3D: sube al almacenamiento y guarda { ruta, url, alt, bytes }. */
export function ControlArchivo({ campo, valor, alCambiar, ruta, errores, contexto }: PropsControl<ValorImagen | null>) {
  const [subiendo, setSubiendo] = React.useState(false);
  const [fallo, setFallo] = React.useState<string | null>(null);
  const esImagen = campo.tipo === 'imagen';
  const aceptar = campo.formatos?.length
    ? campo.formatos.map((f) => `.${f}`).join(',')
    : esImagen
      ? 'image/*'
      : '.glb,.gltf';

  async function elegir(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    if (campo.maxBytes && archivo.size > campo.maxBytes) {
      setFallo(
        `El archivo pesa ${(archivo.size / 1e6).toFixed(1)} MB; el máximo es ${(campo.maxBytes / 1e6).toFixed(1)} MB.`,
      );
      return;
    }
    setFallo(null);
    setSubiendo(true);
    try {
      const subido = await contexto.subirArchivo(archivo, esImagen ? 'imagenes' : 'modelos');
      alCambiar({ ...subido, alt: valor?.alt ?? '' });
    } catch (err) {
      setFallo((err as Error).message);
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <Envoltorio campo={campo} ruta={ruta} errores={errores}>
      <div className="grid gap-2 rounded-md border border-dashed border-borde p-3">
        {valor?.url && esImagen && (
          <img src={valor.url} alt={valor.alt ?? ''} className="max-h-36 w-full rounded object-contain" />
        )}
        {valor?.url && !esImagen && <p className="truncate text-xs text-suave">{valor.ruta ?? valor.url}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <label
            className={cn(
              'inline-flex cursor-pointer items-center gap-2 rounded-md border border-borde px-3 py-1.5 text-sm hover:bg-superficie',
              subiendo && 'opacity-50',
            )}
          >
            <Upload className="size-4" aria-hidden />
            {subiendo ? 'Subiendo…' : valor?.url ? 'Cambiar archivo' : 'Subir archivo'}
            <input
              id={idDe(ruta)}
              type="file"
              accept={aceptar}
              className="sr-only"
              disabled={subiendo}
              onChange={elegir}
            />
          </label>
          {valor?.url && (
            <Boton variante="fantasma" tamano="sm" onClick={() => alCambiar(null)}>
              Quitar
            </Boton>
          )}
        </div>
        {esImagen && valor?.url && (
          <div className="grid gap-1">
            <Etiqueta htmlFor={`${idDe(ruta)}-alt`} className="text-xs">
              Texto alternativo (describe la imagen)
            </Etiqueta>
            <Entrada
              id={`${idDe(ruta)}-alt`}
              value={valor.alt ?? ''}
              onChange={(e) => alCambiar({ ...valor, alt: e.target.value })}
              aria-invalid={!!errorDe(errores, `${ruta}.alt`)}
            />
            {errorDe(errores, `${ruta}.alt`) && (
              <p className="text-xs text-peligro">{errorDe(errores, `${ruta}.alt`)}</p>
            )}
          </div>
        )}
        {fallo && (
          <p role="alert" className="text-xs text-peligro">
            {fallo}
          </p>
        )}
        {campo.maxBytes && (
          <p className="text-[11px] text-suave">
            Máximo {(campo.maxBytes / 1e6).toFixed(1)} MB{campo.formatos ? ` · ${campo.formatos.join(', ')}` : ''}
          </p>
        )}
      </div>
    </Envoltorio>
  );
}

/** Formulario de un conjunto de campos (sección, grupo o elemento de lista). */
export function CamposAnidados({
  campos,
  valor,
  alCambiar,
  ruta,
  errores,
  contexto,
}: {
  campos: Campo[];
  valor: Record<string, unknown>;
  alCambiar: (v: Record<string, unknown>) => void;
  ruta: string;
  errores: ErrorValidacion[];
  contexto: ContextoEditor;
}) {
  return (
    <div className="grid gap-4">
      {campos.map((c) => {
        const C = obtenerControl(c.tipo);
        return (
          <C
            key={c.id}
            campo={c}
            valor={valor?.[c.id]}
            ruta={`${ruta}.${c.id}`}
            errores={errores}
            contexto={contexto}
            alCambiar={(v: unknown) => alCambiar({ ...(valor ?? {}), [c.id]: v })}
          />
        );
      })}
    </div>
  );
}

function ControlGrupo({ campo, valor, alCambiar, ruta, errores, contexto }: PropsControl<Record<string, unknown>>) {
  return (
    <fieldset className="grid gap-3 rounded-md border border-borde p-3">
      <legend className="px-1 text-sm font-semibold">{campo.etiqueta}</legend>
      {campo.ayuda && <p className="text-xs text-suave">{campo.ayuda}</p>}
      <CamposAnidados
        campos={campo.campos ?? []}
        valor={valor ?? {}}
        alCambiar={alCambiar}
        ruta={ruta}
        errores={errores}
        contexto={contexto}
      />
    </fieldset>
  );
}

function ElementoOrdenable({
  id,
  children,
  ordenable,
}: {
  id: string;
  ordenable: boolean;
  children: (asa: React.ReactNode) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !ordenable,
  });
  const asa = ordenable ? (
    <button
      type="button"
      className="cursor-grab touch-none rounded p-1 text-suave hover:bg-superficie"
      aria-label="Arrastrar para reordenar"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-4" />
    </button>
  ) : null;
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('rounded-md border border-borde bg-fondo', isDragging && 'z-10 shadow-lg')}
    >
      {children(asa)}
    </li>
  );
}

/** Lista de elementos: agregar, quitar, plegar y reordenar arrastrando (teclado incluido). */
function ControlLista({ campo, valor, alCambiar, ruta, errores, contexto }: PropsControl<Record<string, unknown>[]>) {
  const items = Array.isArray(valor) ? valor : [];
  const [abierto, setAbierto] = React.useState<number | null>(null);
  const ordenable = campo.ordenable !== false;
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  // Clave estable para dnd-kit: id del elemento si existe, si no su posición.
  const claves = items.map((it, i) => String(it?.id ?? `#${i}`));
  const tieneId = campo.campos?.some((c) => c.id === 'id');

  function agregar() {
    const nuevo = objetoPorDefecto(campo.campos ?? []);
    if (tieneId) nuevo.id = `${slug(campo.nombreItem ?? 'item')}-${Math.random().toString(36).slice(2, 7)}`;
    alCambiar([...items, nuevo]);
    setAbierto(items.length);
  }
  function alSoltar(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const de = claves.indexOf(String(e.active.id));
    const a = claves.indexOf(String(e.over.id));
    alCambiar(arrayMove(items, de, a));
    setAbierto(null);
  }
  const titulo = (it: Record<string, unknown>, i: number) => {
    const c = campo.campoTitulo ?? campo.campos?.find((x) => x.tipo === 'texto' && x.id !== 'id')?.id;
    return (c && typeof it?.[c] === 'string' && (it[c] as string)) || `${campo.nombreItem ?? 'Elemento'} ${i + 1}`;
  };
  const errorLista = errorDe(errores, ruta);
  const limite = campo.maxItems !== undefined && items.length >= campo.maxItems;

  return (
    <div className="grid gap-2" data-ruta={ruta}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {campo.etiqueta}{' '}
          <span className="text-suave">
            ({items.length}
            {campo.maxItems ? `/${campo.maxItems}` : ''})
          </span>
        </span>
        <Boton variante="borde" tamano="sm" onClick={agregar} disabled={limite}>
          <Plus aria-hidden /> Agregar {campo.nombreItem ?? ''}
        </Boton>
      </div>
      {campo.ayuda && <p className="text-xs text-suave">{campo.ayuda}</p>}
      {errorLista && (
        <p role="alert" className="text-xs text-peligro">
          {errorLista}
        </p>
      )}
      <DndContext sensors={sensores} collisionDetection={closestCenter} onDragEnd={alSoltar}>
        <SortableContext items={claves} strategy={verticalListSortingStrategy}>
          <ul className="grid gap-2">
            {items.map((it, i) => {
              const conError = errores.some((e) => e.ruta.startsWith(`${ruta}.${i}.`));
              return (
                <ElementoOrdenable key={claves[i]} id={claves[i]!} ordenable={ordenable}>
                  {(asa) => (
                    <>
                      <div className="flex items-center gap-1 px-2 py-1.5">
                        {asa}
                        <button
                          type="button"
                          className="flex flex-1 items-center gap-2 truncate text-left text-sm"
                          aria-expanded={abierto === i}
                          onClick={() => setAbierto(abierto === i ? null : i)}
                        >
                          <ChevronDown aria-hidden className={cn('size-4 transition', abierto === i && 'rotate-180')} />
                          <span className="truncate">{titulo(it, i)}</span>
                          {conError && <span className="size-2 rounded-full bg-peligro" aria-label="Tiene errores" />}
                        </button>
                        <Boton
                          variante="fantasma"
                          tamano="icono"
                          aria-label={`Quitar ${titulo(it, i)}`}
                          onClick={() => alCambiar(items.filter((_, j) => j !== i))}
                        >
                          <Trash2 />
                        </Boton>
                      </div>
                      {abierto === i && (
                        <div className="border-t border-borde p-3">
                          <CamposAnidados
                            campos={(campo.campos ?? []).filter((c) => c.id !== 'id')}
                            valor={it}
                            ruta={`${ruta}.${i}`}
                            errores={errores}
                            contexto={contexto}
                            alCambiar={(v) => alCambiar(items.map((x, j) => (j === i ? v : x)))}
                          />
                        </div>
                      )}
                    </>
                  )}
                </ElementoOrdenable>
              );
            })}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

// Registro de controles base.
registrarControl('texto', ControlTexto);
registrarControl('enlace', ControlTexto);
registrarControl('correo', ControlTexto);
registrarControl('telefono', ControlTexto);
registrarControl('fecha', ControlTexto);
registrarControl('hora', ControlTexto);
registrarControl('textoLargo', ControlTextoLargo);
registrarControl('numero', ControlNumero);
registrarControl('precio', ControlNumero);
registrarControl('porcentaje', ControlNumero);
registrarControl('booleano', ControlBooleano);
registrarControl('seleccion', ControlSeleccion);
registrarControl('multiseleccion', ControlMultiseleccion);
registrarControl('color', ControlColor);
registrarControl('icono', ControlIcono);
registrarControl('imagen', ControlArchivo);
registrarControl('modelo3d', ControlArchivo);
registrarControl('grupo', ControlGrupo);
registrarControl('lista', ControlLista);
