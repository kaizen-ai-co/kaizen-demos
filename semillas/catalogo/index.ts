import type { SemillasPlantilla } from '../registro';
import base from './contenido.json';
import ferreteria from './sectores/ferreteria.json';
// <importaciones-demos>
// </importaciones-demos>

const semillas: SemillasPlantilla = {
  base,
  sectores: { ferreteria },
  demos: {
    // <demos>
    // </demos>
  },
};

export default semillas;
