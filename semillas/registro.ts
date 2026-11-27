/*
 * Registro de semillas: una entrada por plantilla. Cada carpeta tiene su index.ts
 * con { base, sectores, demos } e importaciones estáticas (para que el
 * empaquetador las incluya). `npm run nueva-demo` edita esos index.ts.
 */
import agenda from './agenda';
import catalogo from './catalogo';
import comercial from './comercial';
import panel from './panel';
import presentacion from './presentacion';
import visor3d from './visor3d';

export type Semilla = Record<string, unknown>;
export interface SemillasPlantilla {
  base: Semilla;
  sectores: Record<string, Semilla>;
  demos: Record<string, Semilla>;
}

export const REGISTRO: Record<string, SemillasPlantilla> = { comercial, presentacion, catalogo, visor3d, panel, agenda };
