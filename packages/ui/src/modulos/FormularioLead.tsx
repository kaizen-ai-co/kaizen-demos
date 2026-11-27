'use client';

import * as React from 'react';
import { AreaTexto, Aviso, Boton, CampoFormulario, Entrada, Selector } from '../primitivos';
import { cn } from '../utilidades';

/**
 * Módulo "formulario a lead" (base común). Lo reutilizan las plantillas 1, 2, 4 y 5.
 *
 * - Los campos salen del contenido (editables en /editar).
 * - Envía a `endpoint` (por defecto /api/leads); el servidor valida, aplica el
 *   campo trampa y el límite de envíos, y guarda en sitios/{sitioId}/leads.
 * - `extra` viaja tal cual (p. ej. la configuración 3D elegida o el caso de origen).
 */

export interface CampoLead {
  id: string;
  etiqueta: string;
  tipo: 'texto' | 'correo' | 'telefono' | 'textoLargo' | 'seleccion';
  requerido?: boolean;
  opciones?: string[];
  placeholder?: string;
}

export const CAMPOS_LEAD_POR_DEFECTO: CampoLead[] = [
  { id: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, placeholder: 'Nombre ficticio' },
  { id: 'correo', etiqueta: 'Correo', tipo: 'correo', placeholder: 'nombre@ejemplo.test' },
  { id: 'telefono', etiqueta: 'Teléfono', tipo: 'telefono', placeholder: '300 000 0000' },
  { id: 'mensaje', etiqueta: '¿En qué te ayudamos?', tipo: 'textoLargo' },
];

export interface PropsFormularioLead {
  campos?: CampoLead[];
  origen: string;
  extra?: Record<string, unknown>;
  textoBoton?: string;
  mensajeExito?: string;
  endpoint?: string;
  className?: string;
  /** Se llama con el id del lead creado (útil para redirigir o mostrar resumen). */
  alCrear?: (leadId: string) => void;
}

type Estado = { tipo: 'inicial' } | { tipo: 'enviando' } | { tipo: 'exito' } | { tipo: 'error'; mensaje: string };

export function FormularioLead({
  campos = CAMPOS_LEAD_POR_DEFECTO,
  origen,
  extra,
  textoBoton = 'Enviar',
  mensajeExito = '¡Gracias! Recibimos tus datos y te contactaremos pronto.',
  endpoint = '/api/leads',
  className,
  alCrear,
}: PropsFormularioLead) {
  const [estado, setEstado] = React.useState<Estado>({ tipo: 'inicial' });
  const [errores, setErrores] = React.useState<Record<string, string>>({});
  const idBase = React.useId();

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
    const nuevosErrores: Record<string, string> = {};
    for (const c of campos) {
      const v = (datos[c.id] ?? '').trim();
      if (c.requerido && !v) nuevosErrores[c.id] = 'Este campo es obligatorio.';
      else if (v && c.tipo === 'correo' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) nuevosErrores[c.id] = 'Revisa el correo.';
      else if (v && c.tipo === 'telefono' && !/^[+()\d\s-]{7,20}$/.test(v)) nuevosErrores[c.id] = 'Revisa el teléfono.';
    }
    if (!datos.correo?.trim() && !datos.telefono?.trim() && campos.some((c) => c.id === 'correo' || c.id === 'telefono')) {
      nuevosErrores[campos.find((c) => c.id === 'correo')?.id ?? 'telefono'] = 'Deja un correo o un teléfono.';
    }
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length) return;

    setEstado({ tipo: 'enviando' });
    try {
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...datos, origen, extra }),
      });
      const cuerpo = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(cuerpo.error ?? 'No pudimos enviar el formulario.');
      setEstado({ tipo: 'exito' });
      alCrear?.(cuerpo.id);
    } catch (err) {
      setEstado({ tipo: 'error', mensaje: (err as Error).message });
    }
  }

  if (estado.tipo === 'exito') {
    return (
      <Aviso tono="exito" className={className}>
        <p className="font-semibold">{mensajeExito}</p>
        <button type="button" className="mt-2 text-xs underline" onClick={() => setEstado({ tipo: 'inicial' })}>
          Enviar otro
        </button>
      </Aviso>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className={cn('grid gap-4', className)} aria-busy={estado.tipo === 'enviando'}>
      {campos.map((c) => {
        const id = `${idBase}-${c.id}`;
        const comun = { name: c.id, placeholder: c.placeholder };
        const control =
          c.tipo === 'textoLargo' ? <AreaTexto {...comun} rows={4} /> :
          c.tipo === 'seleccion' ? (
            <Selector {...comun} defaultValue="">
              <option value="" disabled>Elige una opción</option>
              {(c.opciones ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
            </Selector>
          ) : (
            <Entrada
              {...comun}
              type={c.tipo === 'correo' ? 'email' : c.tipo === 'telefono' ? 'tel' : 'text'}
              autoComplete={c.id === 'nombre' ? 'name' : c.tipo === 'correo' ? 'email' : c.tipo === 'telefono' ? 'tel' : 'off'}
              inputMode={c.tipo === 'telefono' ? 'tel' : undefined}
            />
          );
        return (
          <CampoFormulario key={c.id} id={id} etiqueta={c.etiqueta} requerido={c.requerido} error={errores[c.id]}>
            {control}
          </CampoFormulario>
        );
      })}

      {/* Campo trampa: invisible para personas; si llega lleno, el servidor descarta el envío. */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
        <label>
          No llenar
          <input type="text" name="_trampa" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {estado.tipo === 'error' && <Aviso tono="peligro">{estado.mensaje}</Aviso>}

      <Boton type="submit" tamano="lg" disabled={estado.tipo === 'enviando'}>
        {estado.tipo === 'enviando' ? 'Enviando…' : textoBoton}
      </Boton>
      <p className="text-xs text-suave">Demo con datos ficticios: no escribas datos personales reales.</p>
    </form>
  );
}
