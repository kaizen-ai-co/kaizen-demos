import type { Lead } from './tipos';

/**
 * Mapeo de nombres de campo entre el lead de Kaizen y un CRM externo.
 *
 * Santiago enviará los campos del lead de Jericó para que coincidan desde ya.
 * Mientras tanto se usan los nombres propios (mapeo identidad). Cuando lleguen,
 * solo se edita `MAPEO_JERICO`; ninguna plantilla cambia.
 *
 * Formato: clave = ruta en nuestro Lead (con puntos), valor = nombre en el destino.
 */
export type MapeoCampos = Record<string, string>;

export const MAPEO_PROPIO: MapeoCampos = {
  id: 'id',
  nombre: 'nombre',
  'contacto.correo': 'correo',
  'contacto.telefono': 'telefono',
  origen: 'origen',
  etapa: 'etapa',
  responsableId: 'responsable',
  creadoEl: 'creadoEl',
  actualizadoEl: 'actualizadoEl',
};

/** PENDIENTE: reemplazar por los nombres de Jericó cuando Santiago los comparta. */
export const MAPEO_JERICO: MapeoCampos = { ...MAPEO_PROPIO };

function leerRuta(obj: unknown, ruta: string): unknown {
  return ruta.split('.').reduce<unknown>((acc, k) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[k] : undefined), obj);
}

/** Convierte un Lead al formato plano del destino. Los campos del formulario van en `campos`. */
export function leadADestino(lead: Lead, mapeo: MapeoCampos = MAPEO_PROPIO): Record<string, unknown> {
  const salida: Record<string, unknown> = {};
  for (const [origen, destino] of Object.entries(mapeo)) {
    const valor = leerRuta(lead, origen);
    if (valor !== undefined) salida[destino] = valor;
  }
  salida.campos = lead.campos;
  if (lead.notas.length) salida.notas = lead.notas.map((n) => n.texto);
  return salida;
}
