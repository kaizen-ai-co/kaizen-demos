import {
  CLAVE_ESTRUCTURA,
  normalizarOpciones,
  type Campo,
  type Contenido,
  type EsquemaContenido,
  type RolEdicion,
  type Seccion,
  type ValorImagen,
} from './esquema';

export interface ErrorValidacion {
  /** Ruta con puntos: "servicios.items.2.titulo". */
  ruta: string;
  mensaje: string;
}

const vacio = (v: unknown) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
const RE_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RE_TEL = /^[+()\d\s-]{7,20}$/;
const RE_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const RE_URL = /^(https?:\/\/|\/|#|mailto:|tel:)/i;

/** Validadores extra que una plantilla registra para sus tipos propios. */
const validadoresPropios = new Map<string, (campo: Campo, valor: unknown, ruta: string) => ErrorValidacion[]>();
export function registrarValidador(
  tipo: string,
  fn: (campo: Campo, valor: unknown, ruta: string) => ErrorValidacion[],
) {
  validadoresPropios.set(tipo, fn);
}

function validarCampo(campo: Campo, valor: unknown, ruta: string): ErrorValidacion[] {
  const e: ErrorValidacion[] = [];
  const err = (mensaje: string, r = ruta) => e.push({ ruta: r, mensaje });

  if (vacio(valor)) {
    if (campo.requerido) err(`«${campo.etiqueta}» es obligatorio.`);
    else if (campo.tipo === 'lista' && (campo.minItems ?? 0) > 0)
      err(`«${campo.etiqueta}» necesita al menos ${campo.minItems}.`);
    return e;
  }

  switch (campo.tipo) {
    case 'texto':
    case 'textoLargo':
    case 'enlace':
    case 'correo':
    case 'telefono':
    case 'icono': {
      if (typeof valor !== 'string') {
        err(`«${campo.etiqueta}» debe ser texto.`);
        break;
      }
      if (campo.min !== undefined && valor.length < campo.min)
        err(`«${campo.etiqueta}» debe tener al menos ${campo.min} caracteres.`);
      if (campo.max !== undefined && valor.length > campo.max)
        err(`«${campo.etiqueta}» admite máximo ${campo.max} caracteres (tiene ${valor.length}).`);
      if (campo.patron && !new RegExp(campo.patron).test(valor))
        err(`«${campo.etiqueta}» no tiene el formato esperado.`);
      if (campo.tipo === 'correo' && !RE_CORREO.test(valor)) err(`«${campo.etiqueta}» no es un correo válido.`);
      if (campo.tipo === 'telefono' && !RE_TEL.test(valor)) err(`«${campo.etiqueta}» no es un teléfono válido.`);
      if (campo.tipo === 'enlace' && !RE_URL.test(valor)) err(`«${campo.etiqueta}» debe empezar por https://, / o #.`);
      break;
    }
    case 'numero':
    case 'precio':
    case 'porcentaje': {
      if (typeof valor !== 'number' || Number.isNaN(valor)) {
        err(`«${campo.etiqueta}» debe ser un número.`);
        break;
      }
      if (campo.min !== undefined && valor < campo.min) err(`«${campo.etiqueta}» debe ser al menos ${campo.min}.`);
      if (campo.max !== undefined && valor > campo.max) err(`«${campo.etiqueta}» debe ser máximo ${campo.max}.`);
      if (campo.tipo === 'precio' && valor < 0) err(`«${campo.etiqueta}» no puede ser negativo.`);
      break;
    }
    case 'booleano':
      if (typeof valor !== 'boolean') err(`«${campo.etiqueta}» debe ser sí o no.`);
      break;
    case 'color':
      if (typeof valor !== 'string' || !RE_COLOR.test(valor))
        err(`«${campo.etiqueta}» debe ser un color hexadecimal (#1d4ed8).`);
      break;
    case 'seleccion': {
      const validas = normalizarOpciones(campo.opciones).map((o) => o.valor);
      if (validas.length && !validas.includes(String(valor))) err(`«${campo.etiqueta}»: opción no válida.`);
      break;
    }
    case 'multiseleccion': {
      const validas = normalizarOpciones(campo.opciones).map((o) => o.valor);
      if (!Array.isArray(valor)) {
        err(`«${campo.etiqueta}» debe ser una lista.`);
        break;
      }
      if (validas.length && valor.some((v) => !validas.includes(String(v))))
        err(`«${campo.etiqueta}»: hay opciones no válidas.`);
      break;
    }
    case 'imagen':
    case 'modelo3d': {
      const img = valor as ValorImagen;
      if (typeof img !== 'object' || !img?.url) {
        err(`«${campo.etiqueta}»: falta el archivo.`);
        break;
      }
      if (campo.maxBytes && img.bytes && img.bytes > campo.maxBytes) {
        err(
          `«${campo.etiqueta}» pesa ${(img.bytes / 1e6).toFixed(1)} MB; el máximo es ${(campo.maxBytes / 1e6).toFixed(1)} MB.`,
        );
      }
      if (campo.formatos?.length) {
        const ext = (img.ruta ?? img.url).split('?')[0]!.split('.').pop()?.toLowerCase();
        if (ext && !campo.formatos.includes(ext)) err(`«${campo.etiqueta}» debe ser ${campo.formatos.join(', ')}.`);
      }
      if (campo.tipo === 'imagen' && !img.alt?.trim())
        err(`«${campo.etiqueta}»: escribe el texto alternativo (accesibilidad).`, `${ruta}.alt`);
      break;
    }
    case 'lista': {
      if (!Array.isArray(valor)) {
        err(`«${campo.etiqueta}» debe ser una lista.`);
        break;
      }
      if (campo.minItems !== undefined && valor.length < campo.minItems)
        err(`«${campo.etiqueta}» necesita al menos ${campo.minItems}.`);
      if (campo.maxItems !== undefined && valor.length > campo.maxItems)
        err(`«${campo.etiqueta}» admite máximo ${campo.maxItems}.`);
      valor.forEach((item, i) => {
        for (const sub of campo.campos ?? []) {
          e.push(...validarCampo(sub, (item as Record<string, unknown>)?.[sub.id], `${ruta}.${i}.${sub.id}`));
        }
      });
      break;
    }
    case 'grupo': {
      for (const sub of campo.campos ?? []) {
        e.push(...validarCampo(sub, (valor as Record<string, unknown>)?.[sub.id], `${ruta}.${sub.id}`));
      }
      break;
    }
    default: {
      const propio = validadoresPropios.get(campo.tipo);
      if (propio) e.push(...propio(campo, valor, ruta));
    }
  }
  return e;
}

/**
 * Valida el contenido completo contra el esquema. El editor bloquea "Publicar"
 * si devuelve errores y el servidor vuelve a llamarla antes de publicar.
 * Las secciones ocultas no bloquean la publicación.
 */
export function validarContenido(esquema: EsquemaContenido, datos: Contenido): ErrorValidacion[] {
  const ocultas = new Set(datos[CLAVE_ESTRUCTURA]?.ocultas ?? []);
  const errores: ErrorValidacion[] = [];
  for (const s of esquema.secciones) {
    if (ocultas.has(s.id)) continue;
    const valores = (datos[s.id] ?? {}) as Record<string, unknown>;
    for (const c of s.campos) errores.push(...validarCampo(c, valores[c.id], `${s.id}.${c.id}`));
  }
  return errores;
}

// ── Protección por rol ────────────────────────────────────────────────

const puedeEditar = (rol: RolEdicion, requerido?: RolEdicion) =>
  rol === 'desarrollador' || requerido !== 'desarrollador';

function filtrarCampos(campos: Campo[], rol: RolEdicion): Campo[] {
  return campos
    .filter((c) => puedeEditar(rol, c.rol))
    .map((c) => (c.campos ? { ...c, campos: filtrarCampos(c.campos, rol) } : c));
}

/** Esquema que ve cada rol: los campos reservados al Desarrollador desaparecen para los demás. */
export function filtrarPorRol(esquema: EsquemaContenido, rol: RolEdicion): EsquemaContenido {
  return {
    ...esquema,
    secciones: esquema.secciones
      .filter((s) => puedeEditar(rol, s.rol))
      .map((s): Seccion => ({ ...s, campos: filtrarCampos(s.campos, rol) })),
  };
}

const igual = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

function itemsPorClave(lista: unknown): Map<string, Record<string, unknown>> {
  const m = new Map<string, Record<string, unknown>>();
  (Array.isArray(lista) ? lista : []).forEach((item, i) => {
    const r = (item ?? {}) as Record<string, unknown>;
    m.set(typeof r.id === 'string' && r.id ? r.id : `#${i}`, r);
  });
  return m;
}

function revisarCampos(
  campos: Campo[],
  rol: RolEdicion,
  antes: Record<string, unknown>,
  despues: Record<string, unknown>,
  ruta: string,
  salida: string[],
) {
  for (const c of campos) {
    const r = `${ruta}.${c.id}`;
    if (!puedeEditar(rol, c.rol)) {
      if (!igual(antes?.[c.id], despues?.[c.id])) salida.push(r);
      continue;
    }
    if (c.tipo === 'grupo' && c.campos) {
      revisarCampos(
        c.campos,
        rol,
        (antes?.[c.id] ?? {}) as Record<string, unknown>,
        (despues?.[c.id] ?? {}) as Record<string, unknown>,
        r,
        salida,
      );
    }
    if (c.tipo === 'lista' && c.campos?.some((s) => s.rol === 'desarrollador' || s.campos)) {
      const a = itemsPorClave(antes?.[c.id]);
      for (const [clave, item] of itemsPorClave(despues?.[c.id])) {
        revisarCampos(c.campos, rol, a.get(clave) ?? {}, item, `${r}.${clave}`, salida);
      }
    }
  }
}

/** Rutas que el rol cambió sin permiso. El servidor rechaza o restaura estos cambios. */
export function cambiosProhibidos(
  esquema: EsquemaContenido,
  rol: RolEdicion,
  antes: Contenido,
  despues: Contenido,
): string[] {
  if (rol === 'desarrollador') return [];
  const salida: string[] = [];
  if (!igual(antes[CLAVE_ESTRUCTURA], despues[CLAVE_ESTRUCTURA])) salida.push(CLAVE_ESTRUCTURA);
  for (const s of esquema.secciones) {
    const a = (antes[s.id] ?? {}) as Record<string, unknown>;
    const d = (despues[s.id] ?? {}) as Record<string, unknown>;
    if (s.rol === 'desarrollador') {
      if (!igual(a, d)) salida.push(s.id);
      continue;
    }
    revisarCampos(s.campos, rol, a, d, s.id, salida);
  }
  return salida;
}

/**
 * Devuelve `despues` con todo lo que el rol no puede tocar restaurado desde `antes`.
 * Así un Administrador nunca altera tema, orden, reglas o campos de Desarrollador,
 * aunque manipule la petición a mano.
 */
export function fusionarSeguro(
  esquema: EsquemaContenido,
  rol: RolEdicion,
  antes: Contenido,
  despues: Contenido,
): Contenido {
  if (rol === 'desarrollador') return despues;
  const salida: Contenido = structuredClone(despues);
  if (antes[CLAVE_ESTRUCTURA] !== undefined) salida[CLAVE_ESTRUCTURA] = structuredClone(antes[CLAVE_ESTRUCTURA]);
  else delete salida[CLAVE_ESTRUCTURA];

  const restaurar = (campos: Campo[], a: Record<string, unknown>, d: Record<string, unknown>) => {
    for (const c of campos) {
      if (!puedeEditar(rol, c.rol)) {
        if (a && c.id in a) d[c.id] = structuredClone(a[c.id]);
        else delete d[c.id];
        continue;
      }
      if (c.tipo === 'grupo' && c.campos) {
        d[c.id] = d[c.id] ?? {};
        restaurar(c.campos, (a?.[c.id] ?? {}) as Record<string, unknown>, d[c.id] as Record<string, unknown>);
      }
      if (c.tipo === 'lista' && c.campos && Array.isArray(d[c.id])) {
        const previos = itemsPorClave(a?.[c.id]);
        (d[c.id] as Record<string, unknown>[]).forEach((item, i) => {
          const clave = typeof item?.id === 'string' && item.id ? item.id : `#${i}`;
          restaurar(c.campos!, previos.get(clave) ?? {}, item);
        });
      }
    }
  };

  for (const s of esquema.secciones) {
    const a = (antes[s.id] ?? {}) as Record<string, unknown>;
    if (s.rol === 'desarrollador') {
      salida[s.id] = structuredClone(a);
      continue;
    }
    salida[s.id] = salida[s.id] ?? {};
    restaurar(s.campos, a, salida[s.id] as Record<string, unknown>);
  }
  return salida;
}

/** Revisión del propio esquema (lo corre la CI): ids únicos, tipos conocidos, listas con campos. */
export function revisarEsquema(esquema: EsquemaContenido, tiposPropios: string[] = []): string[] {
  const problemas: string[] = [];
  const conocidos = new Set([
    'texto',
    'textoLargo',
    'numero',
    'precio',
    'porcentaje',
    'booleano',
    'imagen',
    'modelo3d',
    'color',
    'seleccion',
    'multiseleccion',
    'enlace',
    'correo',
    'telefono',
    'icono',
    'fecha',
    'hora',
    'lista',
    'grupo',
    ...tiposPropios,
  ]);
  if (!esquema.plantilla) problemas.push('Falta "plantilla".');
  const idsSecciones = new Set<string>();
  const revisar = (campos: Campo[], ruta: string) => {
    const ids = new Set<string>();
    for (const c of campos) {
      if (!c.id || !/^[a-zA-Z][a-zA-Z0-9]*$/.test(c.id))
        problemas.push(`${ruta}: id inválido "${c.id}" (usa camelCase sin espacios).`);
      if (ids.has(c.id)) problemas.push(`${ruta}: id repetido "${c.id}".`);
      ids.add(c.id);
      if (!c.etiqueta) problemas.push(`${ruta}.${c.id}: falta "etiqueta".`);
      if (!conocidos.has(c.tipo))
        problemas.push(`${ruta}.${c.id}: tipo desconocido "${c.tipo}". Regístralo con registrarControl o corrígelo.`);
      if ((c.tipo === 'lista' || c.tipo === 'grupo') && !c.campos?.length)
        problemas.push(`${ruta}.${c.id}: una ${c.tipo} necesita "campos".`);
      if ((c.tipo === 'seleccion' || c.tipo === 'multiseleccion') && !c.opciones?.length && !c.props?.opcionesDesde) {
        problemas.push(`${ruta}.${c.id}: una selección necesita "opciones".`);
      }
      if (c.campos) revisar(c.campos, `${ruta}.${c.id}`);
    }
  };
  for (const s of esquema.secciones) {
    if (idsSecciones.has(s.id)) problemas.push(`Sección repetida "${s.id}".`);
    if (s.id.startsWith('_')) problemas.push(`La sección "${s.id}" no puede empezar por "_" (reservado).`);
    idsSecciones.add(s.id);
    revisar(s.campos, s.id);
  }
  return problemas;
}
