'use client';

import * as React from 'react';
import { AreaTexto, Aviso, Boton, CampoFormulario, Entrada, Selector } from '../primitivos';
import { cn } from '../utilidades';
import { TEXTOS_FORMULARIO_LEAD, type TextosFormularioLead } from './textos-formulario';

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
  /** Textos fijos de la interfaz; los que falten (o lleguen vacíos) usan el texto por defecto. */
  textos?: TextosFormularioLead;
  endpoint?: string;
  className?: string;
  /** Se llama con el id del lead creado (útil para redirigir o mostrar resumen). */
  alCrear?: (leadId: string) => void;
}

type Estado = { tipo: 'inicial' } | { tipo: 'enviando' } | { tipo: 'exito' } | { tipo: 'error'; mensaje: string };

export function FormularioLead({
  campos: camposProp,
  origen,
  extra,
  textoBoton = 'Enviar',
  mensajeExito = '¡Gracias! Recibimos tus datos y te contactaremos pronto.',
  textos: textosProp,
  endpoint = '/api/leads',
  className,
  alCrear,
}: PropsFormularioLead) {
  const t = { ...TEXTOS_FORMULARIO_LEAD };
  for (const [k, v] of Object.entries(textosProp ?? {}) as [keyof TextosFormularioLead, unknown][])
    if (typeof v === 'string' && v.trim()) t[k] = v;
  const etiquetasPorDefecto: Record<string, string> = {
    nombre: t.etiquetaNombre,
    correo: t.etiquetaCorreo,
    telefono: t.etiquetaTelefono,
    mensaje: t.etiquetaMensaje,
  };
  const campos =
    camposProp ?? CAMPOS_LEAD_POR_DEFECTO.map((c) => ({ ...c, etiqueta: etiquetasPorDefecto[c.id] ?? c.etiqueta }));
  const [estado, setEstado] = React.useState<Estado>({ tipo: 'inicial' });
  const [errores, setErrores] = React.useState<Record<string, string>>({});
  const idBase = React.useId();

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
    const nuevosErrores: Record<string, string> = {};
    for (const c of campos) {
      const v = (datos[c.id] ?? '').trim();
      if (c.requerido && !v) nuevosErrores[c.id] = t.errorObligatorio;
      else if (v && c.tipo === 'correo' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) nuevosErrores[c.id] = t.errorCorreo;
      else if (v && c.tipo === 'telefono' && !/^[+()\d\s-]{7,20}$/.test(v)) nuevosErrores[c.id] = t.errorTelefono;
    }
    if (
      !datos.correo?.trim() &&
      !datos.telefono?.trim() &&
      campos.some((c) => c.id === 'correo' || c.id === 'telefono')
    ) {
      nuevosErrores[campos.find((c) => c.id === 'correo')?.id ?? 'telefono'] = t.errorSinContacto;
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
      if (!r.ok) throw new Error(cuerpo.error ?? t.errorEnvio);
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
          {t.textoEnviarOtro}
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
          c.tipo === 'textoLargo' ? (
            <AreaTexto {...comun} rows={4} />
          ) : c.tipo === 'seleccion' ? (
            <Selector {...comun} defaultValue="">
              <option value="" disabled>
                {t.textoElegirOpcion}
              </option>
              {(c.opciones ?? []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Selector>
          ) : (
            <Entrada
              {...comun}
              type={c.tipo === 'correo' ? 'email' : c.tipo === 'telefono' ? 'tel' : 'text'}
              autoComplete={
                c.id === 'nombre' ? 'name' : c.tipo === 'correo' ? 'email' : c.tipo === 'telefono' ? 'tel' : 'off'
              }
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
      <div
        aria-hidden="true"
        style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}
      >
        <label>
          No llenar
          <input type="text" name="_trampa" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {estado.tipo === 'error' && <Aviso tono="peligro">{estado.mensaje}</Aviso>}

      <Boton type="submit" tamano="lg" disabled={estado.tipo === 'enviando'}>
        {estado.tipo === 'enviando' ? t.textoEnviando : textoBoton}
      </Boton>
      <p className="text-xs text-suave">Demo con datos ficticios: no escribas datos personales reales.</p>
    </form>
  );
}
