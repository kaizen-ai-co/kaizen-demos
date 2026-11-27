import type { SemillasPlantilla } from '../registro';
import base from './contenido.json';
import clinica from './sectores/clinica.json';
// <importaciones-demos>
// </importaciones-demos>

const semillas: SemillasPlantilla = {
  base,
  sectores: { clinica },
  demos: {
    // <demos>
    // </demos>
  },
};

export default semillas;
