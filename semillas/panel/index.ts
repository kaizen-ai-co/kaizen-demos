import type { SemillasPlantilla } from '../registro';
import base from './contenido.json';
import inmobiliaria from './sectores/inmobiliaria.json';
// <importaciones-demos>
// </importaciones-demos>

const semillas: SemillasPlantilla = {
  base,
  sectores: { inmobiliaria },
  demos: {
    // <demos>
    // </demos>
  },
};

export default semillas;
