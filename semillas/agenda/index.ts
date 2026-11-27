import type { SemillasPlantilla } from '../registro';
import base from './contenido.json';
import clinicaEstetica from './sectores/clinica-estetica.json';
// <importaciones-demos>
// </importaciones-demos>

const semillas: SemillasPlantilla = {
  base,
  sectores: { 'clinica-estetica': clinicaEstetica },
  demos: {
    // <demos>
    // </demos>
  },
};

export default semillas;
