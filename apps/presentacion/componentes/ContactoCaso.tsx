import { Aparecer, Tarjeta, texto } from '@kaizen/ui';
import type { PropsBloque } from '@kaizen/ui/bloques';
import { FormularioCaso } from './FormularioCaso';

/**
 * Contacto de la plantilla 2. Campos: titulo, subtitulo, textoCaso, textoBoton, mensajeExito,
 * correo, telefono, direccion. Recibe en `contexto.casos` la lista {id, titulo} para mostrar el caso de origen.
 */
export function ContactoCaso({ id = 'contacto', datos, contexto }: PropsBloque) {
  const casos = (contexto?.casos as { id: string; titulo: string }[] | undefined) ?? [];
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="k-seccion">
      <div className="k-contenedor">
        <Aparecer className="mx-auto mb-10 max-w-2xl text-center">
          <h2 id={`${id}-titulo`} className="text-3xl md:text-4xl">
            {texto(datos.titulo, 'Contacto')}
          </h2>
          {texto(datos.subtitulo) && <p className="mt-3 text-lg text-suave">{texto(datos.subtitulo)}</p>}
        </Aparecer>
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
          </div>
          <Tarjeta className="md:col-span-3">
            <FormularioCaso
              casos={casos}
              textoCaso={texto(datos.textoCaso, 'Nos escribes por el caso:')}
              textoBoton={texto(datos.textoBoton, 'Enviar')}
              mensajeExito={texto(datos.mensajeExito) || undefined}
            />
          </Tarjeta>
        </div>
      </div>
    </section>
  );
}
