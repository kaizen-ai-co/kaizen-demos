import type { ComponentType } from 'react';
import {
  Cifras, ComoTrabajamos, Contacto, Encabezado, Equipo, Logos, Pie, Portada, Precios, PreguntasFrecuentes,
  Problema, QuienesSomos, Servicios, Testimonios, type PropsBloque,
} from './comunes';

export * from './comunes';

export type Bloque = ComponentType<PropsBloque>;

/**
 * Registro de bloques por id de sección. Una app puede ampliarlo o reemplazar
 * uno pasando su propio mapa a <RenderizadorSecciones bloques={{...BLOQUES, galeria: MiGaleria}} />.
 */
export const BLOQUES: Record<string, Bloque> = {
  encabezado: Encabezado,
  portada: Portada,
  problema: Problema,
  servicios: Servicios,
  comoTrabajamos: ComoTrabajamos,
  testimonios: Testimonios,
  precios: Precios,
  preguntas: PreguntasFrecuentes,
  contacto: Contacto,
  pie: Pie,
  quienesSomos: QuienesSomos,
  equipo: Equipo,
  cifras: Cifras,
  logos: Logos,
};

export interface SeccionRender {
  id: string;
  variante?: string;
  datos: Record<string, unknown>;
}

/** Pinta las secciones visibles en el orden elegido por el Desarrollador. */
export function RenderizadorSecciones({
  secciones,
  bloques = BLOQUES,
  contexto,
}: {
  secciones: SeccionRender[];
  bloques?: Record<string, Bloque>;
  contexto?: Record<string, unknown>;
}) {
  return (
    <>
      {secciones.map((s) => {
        const B = bloques[s.id];
        if (!B) {
          if (process.env.NODE_ENV !== 'production') {
            return (
              <div key={s.id} className="k-contenedor my-4 rounded border border-dashed border-aviso p-4 text-sm">
                Falta registrar un bloque para la sección «{s.id}».
              </div>
            );
          }
          return null;
        }
        return <B key={s.id} id={s.id} datos={s.datos} variante={s.variante} contexto={contexto} />;
      })}
    </>
  );
}
