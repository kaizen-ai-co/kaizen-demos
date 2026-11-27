import { plantilla } from '@/lib/plantilla';

// Solo sirve archivos del proveedor en memoria (desarrollo local). Firebase entrega sus propias URL.
export const { GET } = plantilla.rutas.archivo;
