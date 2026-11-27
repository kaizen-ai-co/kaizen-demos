'use client';

import { Editor, Envoltorio, registrarControl, type PropsControl, type PropsEditor } from '@kaizen/editor/react';
import { Boton } from '@kaizen/ui';
import dynamic from 'next/dynamic';
import { useMemo, useRef } from 'react';
import type { ApiVisor } from '@/componentes/Visor';
import { normalizarEscena, normalizarPartes, normalizarVista, seleccionInicial, type VistaCamara } from '@/lib/tipos';

const Visor = dynamic(() => import('@/componentes/Visor'), {
  ssr: false,
  loading: () => <div className="flex h-64 items-center justify-center rounded-md border border-borde bg-superficie text-xs text-suave">Cargando visor…</div>,
});

/**
 * Control propio "vistaCamara": mini visor con el modelo actual. El Administrador gira y
 * acerca, y "Guardar vista" toma la cámara y el objetivo de OrbitControls.
 */
function ControlVistaCamara({ campo, valor, alCambiar, ruta, errores, contexto }: PropsControl<VistaCamara | null>) {
  const vista = normalizarVista(valor);
  const api = useRef<ApiVisor | null>(null);
  const c = contexto.contenido as Record<string, Record<string, unknown> | undefined>;
  const partes = useMemo(() => normalizarPartes(c.partes?.partes), [c.partes]);
  const seleccion = useMemo(() => seleccionInicial(partes), [partes]);
  const modeloUrl = (c.modelo?.archivo as { url?: string } | null)?.url;

  return (
    <Envoltorio campo={campo} ruta={ruta} errores={errores}>
      <Visor
        modeloUrl={modeloUrl || undefined}
        partes={partes}
        seleccion={seleccion}
        vista={vista}
        escena={normalizarEscena(c.escena)}
        etiqueta="Vista previa de la cámara inicial"
        textoReiniciar="Volver a la guardada"
        className="h-64 w-full"
        alListo={(a) => (api.current = a)}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Boton
          tamano="sm"
          onClick={() => {
            const v = api.current?.leerVista();
            if (v) alCambiar(v);
          }}
        >
          Guardar vista
        </Boton>
        <span className="font-mono text-[11px] text-suave">
          pos [{vista.posicion.join(', ')}] · obj [{vista.objetivo.join(', ')}] · fov {vista.fov}
        </span>
      </div>
    </Envoltorio>
  );
}

registrarControl('vistaCamara', ControlVistaCamara);

export default function EditorVisor(props: PropsEditor) {
  return <Editor {...props} />;
}
