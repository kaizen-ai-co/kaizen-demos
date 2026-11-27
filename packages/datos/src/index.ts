// Punto de entrada seguro para cliente y servidor: tipos, contratos y reglas puras.
// Para obtener la capa de datos (solo servidor): import { obtenerCapaDatos } from '@kaizen/datos/servidor'.
export * from './tipos';
export * from './interfaces';
export * from './acceso';
export * from './mapeo-leads';
export { seCruzan, citaChoca, aplicarCambiosLead, nuevoId, ahoraISO } from './utilidades';
