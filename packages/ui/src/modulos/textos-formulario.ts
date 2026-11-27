// Sin 'use client': el tipo, los textos por defecto y textosFormularioDe() se usan tanto en
// Server Components (para leer el contenido) como en el formulario del cliente.

/**
 * Textos fijos de la interfaz del formulario (editables desde /editar en cada plantilla).
 * Todos son opcionales: si no llegan, se usa el texto por defecto de TEXTOS_FORMULARIO_LEAD.
 */
export interface TextosFormularioLead {
  /** Etiquetas de los campos por defecto (solo aplican cuando no se pasan `campos`). */
  etiquetaNombre?: string;
  etiquetaCorreo?: string;
  etiquetaTelefono?: string;
  etiquetaMensaje?: string;
  errorObligatorio?: string;
  errorCorreo?: string;
  errorTelefono?: string;
  errorSinContacto?: string;
  /** Error si el servidor no devuelve un mensaje propio. */
  errorEnvio?: string;
  textoEnviarOtro?: string;
  textoElegirOpcion?: string;
  textoEnviando?: string;
}

export const TEXTOS_FORMULARIO_LEAD: Required<TextosFormularioLead> = {
  etiquetaNombre: 'Nombre',
  etiquetaCorreo: 'Correo',
  etiquetaTelefono: 'Teléfono',
  etiquetaMensaje: '¿En qué te ayudamos?',
  errorObligatorio: 'Este campo es obligatorio.',
  errorCorreo: 'Revisa el correo.',
  errorTelefono: 'Revisa el teléfono.',
  errorSinContacto: 'Deja un correo o un teléfono.',
  errorEnvio: 'No pudimos enviar el formulario.',
  textoEnviarOtro: 'Enviar otro',
  textoElegirOpcion: 'Elige una opción',
  textoEnviando: 'Enviando…',
};

/** Toma de una sección del contenido solo las claves de TextosFormularioLead que sean texto. */
export function textosFormularioDe(seccion: unknown): TextosFormularioLead {
  const datos = (seccion ?? {}) as Record<string, unknown>;
  const textos: TextosFormularioLead = {};
  for (const k of Object.keys(TEXTOS_FORMULARIO_LEAD) as (keyof TextosFormularioLead)[]) {
    const v = datos[k];
    if (typeof v === 'string') textos[k] = v;
  }
  return textos;
}
