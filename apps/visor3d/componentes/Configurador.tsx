'use client';

import { Tarjeta, cn } from '@kaizen/ui';
import { CAMPOS_LEAD_POR_DEFECTO, FormularioLead, type TextosFormularioLead } from '@kaizen/ui/modulos';
import dynamic from 'next/dynamic';
import { createContext, useContext, useMemo, useState } from 'react';
import {
  opcionElegida,
  resumenSeleccion,
  seleccionInicial,
  type Escena,
  type Parte,
  type VistaCamara,
} from '@/lib/tipos';

// El texto de carga viene del contenido; `loading` de next/dynamic no recibe props, así que se lee de un contexto.
const TextoPreparando = createContext('Preparando visor 3D…');

function PreparandoVisor() {
  const texto = useContext(TextoPreparando);
  return (
    <div
      role="status"
      className="flex aspect-square w-full animate-pulse items-center justify-center rounded-xl border border-borde bg-superficie text-sm text-suave md:aspect-[4/3]"
    >
      {texto}
    </div>
  );
}

// Carga diferida: three.js solo se descarga en el navegador y cuando hace falta.
const Visor = dynamic(() => import('./Visor'), {
  ssr: false,
  loading: () => <PreparandoVisor />,
});

export interface TextosConfigurador {
  preparandoVisor: string;
  cargandoModelo: string;
  textoReiniciar: string;
  avisoSinWebgl: string;
  etiquetaModelo: string;
}

export interface PropsConfigurador {
  producto: { nombre: string; descripcion?: string };
  modeloUrl?: string;
  partes: Parte[];
  vista: VistaCamara;
  escena: Escena;
  imagenReserva?: { src: string; alt: string } | null;
  ayuda?: { instrucciones?: string; consejos?: string[] } | null;
  solicitud: {
    titulo: string;
    subtitulo?: string;
    textoBoton: string;
    mensajeExito: string;
    etiquetaResumen: string;
    etiquetas: { nombre: string; correo: string; telefono: string; mensaje: string };
    /** Estados, errores y botones del formulario (desde la sección `solicitud`). */
    textosFormulario?: TextosFormularioLead;
  };
  textos: TextosConfigurador;
}

export function Configurador({
  producto,
  modeloUrl,
  partes,
  vista,
  escena,
  imagenReserva,
  ayuda,
  solicitud,
  textos,
}: PropsConfigurador) {
  const [seleccion, setSeleccion] = useState(() => seleccionInicial(partes));
  const resumen = useMemo(() => resumenSeleccion(partes, seleccion), [partes, seleccion]);
  // Mismos campos del formulario base; solo las etiquetas visibles salen del contenido.
  const etiquetas = solicitud.etiquetas;
  const campos = useMemo(
    () =>
      CAMPOS_LEAD_POR_DEFECTO.map((c) => {
        const etiqueta = (etiquetas as Record<string, string>)[c.id];
        return etiqueta ? { ...c, etiqueta } : c;
      }),
    [etiquetas],
  );

  return (
    <div id="configurador" className="k-contenedor grid gap-8 pb-16 lg:grid-cols-[1.4fr_1fr]">
      <div className="lg:sticky lg:top-20 lg:self-start">
        <TextoPreparando.Provider value={textos.preparandoVisor}>
          <Visor
            modeloUrl={modeloUrl}
            partes={partes}
            seleccion={seleccion}
            vista={vista}
            escena={escena}
            imagenReserva={imagenReserva}
            etiqueta={`${textos.etiquetaModelo} ${producto.nombre}: ${resumen}`}
            textoReiniciar={textos.textoReiniciar}
            textoCargando={textos.cargandoModelo}
            textoSinWebgl={textos.avisoSinWebgl}
            className="aspect-square w-full md:aspect-[4/3]"
          />
        </TextoPreparando.Provider>
        {ayuda?.instrucciones && <p className="mt-3 text-sm text-suave">{ayuda.instrucciones}</p>}
      </div>

      <div className="grid content-start gap-6">
        <div>
          <h2 className="text-2xl">{producto.nombre}</h2>
          {producto.descripcion && <p className="mt-1 text-suave">{producto.descripcion}</p>}
        </div>

        {partes.map((parte) => {
          const elegida = opcionElegida(parte, seleccion);
          return (
            <fieldset key={parte.id} className="grid gap-2">
              <legend className="mb-2 text-sm font-semibold">
                {parte.nombre}: <span className="font-normal text-suave">{elegida?.nombre}</span>
              </legend>
              <div role="radiogroup" aria-label={parte.nombre} className="flex flex-wrap gap-2">
                {parte.opciones.map((o) => {
                  const activa = elegida?.id === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      role="radio"
                      aria-checked={activa}
                      onClick={() => setSeleccion((s) => ({ ...s, [parte.id]: o.id }))}
                      className={cn(
                        'flex min-h-10 items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition',
                        activa ? 'border-primario ring-2 ring-primario' : 'border-borde hover:bg-superficie',
                      )}
                    >
                      {/* El color de la muestra es un dato del contenido (color del objeto), no del tema. */}
                      <span
                        aria-hidden
                        className="size-5 rounded-full border border-borde"
                        style={{ background: o.color }}
                      />
                      {o.nombre}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}

        {!!ayuda?.consejos?.length && (
          <ul className="grid gap-1 text-sm text-suave">
            {ayuda.consejos.map((c) => (
              <li key={c}>• {c}</li>
            ))}
          </ul>
        )}

        <Tarjeta id="solicitar" className="scroll-mt-24">
          <h2 className="text-xl">{solicitud.titulo}</h2>
          {solicitud.subtitulo && <p className="mt-1 text-sm text-suave">{solicitud.subtitulo}</p>}
          <p className="mt-3 rounded-md bg-superficie p-3 text-sm">
            <strong>{solicitud.etiquetaResumen}</strong> {resumen}
          </p>
          <FormularioLead
            className="mt-4"
            campos={campos}
            origen="visor3d"
            extra={{ producto: producto.nombre, configuracion: seleccion, resumen }}
            textoBoton={solicitud.textoBoton}
            mensajeExito={solicitud.mensajeExito}
            textos={solicitud.textosFormulario}
          />
        </Tarjeta>
      </div>
    </div>
  );
}
