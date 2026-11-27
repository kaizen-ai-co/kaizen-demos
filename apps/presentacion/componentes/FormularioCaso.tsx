'use client';

import { Aviso } from '@kaizen/ui';
import { FormularioLead, type TextosFormularioLead } from '@kaizen/ui/modulos';
import * as React from 'react';

/** Lee el caso desde `?caso=<slug>` o desde `#contacto?caso=<slug>`. */
function leerCaso(): string | null {
  if (typeof window === 'undefined') return null;
  const desdeQuery = new URLSearchParams(window.location.search).get('caso');
  if (desdeQuery) return desdeQuery;
  const hash = window.location.hash;
  const i = hash.indexOf('?');
  return i >= 0 ? new URLSearchParams(hash.slice(i + 1)).get('caso') : null;
}

/**
 * Formulario de contacto que sabe desde qué caso llegó el visitante.
 * Envía origen "caso-<slug>" y extra { caso } para que el lead diga qué le interesó.
 */
export function FormularioCaso({
  casos,
  textoCaso,
  textoBoton,
  mensajeExito,
  textos,
}: {
  casos: { id: string; titulo: string }[];
  textoCaso: string;
  textoBoton: string;
  mensajeExito?: string;
  /** Estados, errores y botones del formulario (desde la sección `contacto`). */
  textos?: TextosFormularioLead;
}) {
  const [caso, setCaso] = React.useState<string | null>(null);

  React.useEffect(() => {
    const actualizar = () => {
      const c = leerCaso();
      // Solo se aceptan casos que existen en el contenido publicado.
      setCaso(c && casos.some((x) => x.id === c) ? c : null);
    };
    actualizar();
    window.addEventListener('hashchange', actualizar);
    return () => window.removeEventListener('hashchange', actualizar);
  }, [casos]);

  const titulo = casos.find((x) => x.id === caso)?.titulo;

  return (
    <div className="grid gap-4">
      {titulo && (
        <Aviso>
          {textoCaso} <strong>{titulo}</strong>
        </Aviso>
      )}
      <FormularioLead
        key={caso ?? 'general'}
        origen={caso ? `caso-${caso}` : 'formulario-web'}
        extra={caso ? { caso } : undefined}
        textoBoton={textoBoton}
        mensajeExito={mensajeExito}
        textos={textos}
      />
    </div>
  );
}
