import type { SemillasPlantilla } from '../registro';
import base from './contenido.json';
import constructora from './sectores/constructora.json';
// <importaciones-demos>
// </importaciones-demos>

const semillas: SemillasPlantilla = {
  base,
  sectores: { constructora },
  demos: {
    // <demos>
    // </demos>
  },
};

export default semillas;
