import type { SemillasPlantilla } from '../registro';
import base from './contenido.json';
import muebles from './sectores/muebles.json';
// <importaciones-demos>
// </importaciones-demos>

const semillas: SemillasPlantilla = {
  base,
  sectores: { muebles },
  demos: {
    // <demos>
    // </demos>
  },
};

export default semillas;
