import type { CapaDatos } from '../interfaces';
import type {
  ArchivoSubido,
  Cita,
  Cotizacion,
  Lead,
  Usuario,
  VersionContenido,
} from '../tipos';
import {
  ahoraISO,
  aplicarCambiosLead,
  citaChoca,
  coincideFiltro,
  nuevoId,
  numeroCotizacion,
} from '../utilidades';

/**
 * Proveedor en memoria: desarrollo local y pruebas, sin servicios externos.
 * Los datos viven en globalThis (sobreviven a la recarga en caliente de Next)
 * y se pierden al reiniciar el servidor. NO sirve para Vercel (cada función
 * tiene su propia memoria): allá se usa `DATOS_PROVEEDOR=firebase`.
 */

interface Almacen {
  usuarios: Map<string, Usuario>;
  contenido: Map<string, VersionContenido[]>; // sitioId → versiones (borrador, publicado, archivadas)
  leads: Map<string, Lead[]>;
  cotizaciones: Map<string, Cotizacion[]>;
  citas: Map<string, Cita[]>;
  archivos: Map<string, { datos: Uint8Array; tipo: string }>;
  colecciones: Map<string, Map<string, Record<string, unknown>>>;
  secuencias: Map<string, number>;
}

const CLAVE = '__kaizenAlmacenMemoria';

/** Cuentas de prueba para el paso 7 de la base común (tres cuentas + cliente). */
export function usuariosDePrueba(sitioId = process.env.SITIO_ID ?? 'demo'): Usuario[] {
  const en14dias = new Date(Date.now() + 14 * 864e5).toISOString();
  return [
    { uid: 'u_dev', correo: 'desarrollador@kaizen.test', nombre: 'Dev de prueba', rol: 'desarrollador', activo: true },
    { uid: 'u_admin', correo: 'administrador@kaizen.test', nombre: 'Admin de prueba', rol: 'administrador', activo: true },
    { uid: 'u_cliente', correo: 'cliente@kaizen.test', nombre: 'Cliente de prueba', rol: 'cliente', activo: true, sitioId, venceEl: en14dias },
    // 'nadie@kaizen.test' NO está en la lista a propósito: debe ver "Sin acceso".
  ];
}

function almacen(): Almacen {
  const g = globalThis as unknown as Record<string, Almacen | undefined>;
  if (!g[CLAVE]) {
    g[CLAVE] = {
      usuarios: new Map(usuariosDePrueba().map((u) => [u.correo, u])),
      contenido: new Map(),
      leads: new Map(),
      cotizaciones: new Map(),
      citas: new Map(),
      archivos: new Map(),
      colecciones: new Map(),
      secuencias: new Map(),
    };
  }
  return g[CLAVE]!;
}

/** Solo pruebas: vacía todo y vuelve a sembrar las cuentas. */
export function reiniciarMemoria(usuarios: Usuario[] = usuariosDePrueba()) {
  const g = globalThis as unknown as Record<string, Almacen | undefined>;
  g[CLAVE] = undefined;
  const a = almacen();
  a.usuarios = new Map(usuarios.map((u) => [u.correo, u]));
}

const clon = <T>(x: T): T => structuredClone(x);
const lista = <T>(m: Map<string, T[]>, k: string) => {
  if (!m.has(k)) m.set(k, []);
  return m.get(k)!;
};

export const PREFIJO_CREDENCIAL_MEMORIA = 'memoria:';

export function crearCapaMemoria(): CapaDatos {
  const a = almacen();

  return {
    proveedor: 'memoria',

    identidad: {
      async verificarSesion(credencial) {
        if (!credencial.startsWith(PREFIJO_CREDENCIAL_MEMORIA)) return null;
        const correo = credencial.slice(PREFIJO_CREDENCIAL_MEMORIA.length);
        const u = almacen().usuarios.get(correo);
        // Una cuenta que no está en la lista vuelve como "no registrada" (rol inválido).
        return u ? clon(u) : { uid: `anon_${correo}`, correo, rol: 'ninguno' as never, activo: false };
      },
      async crearSesion(idToken) {
        return { credencial: idToken, expiraEnSegundos: 60 * 60 * 8 };
      },
      async buscarUsuario(correo) {
        const u = almacen().usuarios.get(correo);
        return u ? clon(u) : null;
      },
    },

    contenido: {
      async leerPublicado(sitioId) {
        const v = lista(a.contenido, sitioId).find((x) => x.estado === 'publicado');
        return v ? (clon(v) as never) : null;
      },
      async leerBorrador(sitioId) {
        const v = lista(a.contenido, sitioId).find((x) => x.estado === 'borrador');
        return v ? (clon(v) as never) : null;
      },
      async guardarBorrador(sitioId, datos, autor) {
        const versiones = lista(a.contenido, sitioId);
        const i = versiones.findIndex((x) => x.estado === 'borrador');
        const v: VersionContenido = { id: 'borrador', sitioId, estado: 'borrador', datos: clon(datos), actualizadoPor: autor, actualizadoEl: ahoraISO() };
        if (i >= 0) versiones[i] = v;
        else versiones.push(v);
        return clon(v) as never;
      },
      async publicar(sitioId, autor) {
        const versiones = lista(a.contenido, sitioId);
        const borrador = versiones.find((x) => x.estado === 'borrador');
        if (!borrador) throw new Error('No hay borrador para publicar.');
        const fecha = ahoraISO();
        const anterior = versiones.find((x) => x.estado === 'publicado');
        if (anterior) {
          anterior.estado = 'archivado';
          anterior.id = `v_${Date.parse(anterior.publicadoEl ?? fecha)}_${nuevoId().slice(0, 4)}`;
        }
        const publicado: VersionContenido = {
          ...clon(borrador), id: 'publicado', estado: 'publicado', publicadoPor: autor, publicadoEl: fecha,
        };
        versiones.push(publicado);
        return clon(publicado);
      },
      async volverAtras(sitioId, autor) {
        const versiones = lista(a.contenido, sitioId);
        const archivadas = versiones
          .filter((x) => x.estado === 'archivado')
          .sort((x, y) => (y.publicadoEl ?? '').localeCompare(x.publicadoEl ?? ''));
        const previa = archivadas[0];
        if (!previa) return null;
        const actual = versiones.find((x) => x.estado === 'publicado');
        const fecha = ahoraISO();
        if (actual) {
          actual.estado = 'archivado';
          actual.id = `v_${Date.now()}_${nuevoId().slice(0, 4)}`;
        }
        previa.estado = 'publicado';
        previa.id = 'publicado';
        previa.publicadoPor = autor;
        previa.publicadoEl = fecha;
        // El borrador pasa a ser igual a lo restaurado, para que el editor no muestre cambios fantasma.
        const iB = versiones.findIndex((x) => x.estado === 'borrador');
        const borrador: VersionContenido = { ...clon(previa), id: 'borrador', estado: 'borrador', actualizadoPor: autor, actualizadoEl: fecha };
        if (iB >= 0) versiones[iB] = borrador;
        else versiones.push(borrador);
        return clon(previa);
      },
      async historial(sitioId, limite = 20) {
        return clon(
          lista(a.contenido, sitioId)
            .filter((x) => x.estado !== 'borrador')
            .sort((x, y) => (y.publicadoEl ?? '').localeCompare(x.publicadoEl ?? ''))
            .slice(0, limite),
        );
      },
    },

    leads: {
      async crear(nuevo) {
        const fecha = ahoraISO();
        const lead: Lead = {
          id: nuevoId('l_'),
          sitioId: nuevo.sitioId,
          nombre: nuevo.nombre,
          contacto: nuevo.contacto,
          origen: nuevo.origen,
          etapa: nuevo.etapa ?? 'nuevo',
          responsableId: nuevo.responsableId,
          notas: [],
          campos: nuevo.campos ?? {},
          extra: nuevo.extra,
          historial: [{ tipo: 'creado', fecha, autor: 'sistema', detalle: nuevo.origen }],
          creadoEl: fecha,
          actualizadoEl: fecha,
        };
        if (nuevo.responsableId) lead.historial.push({ tipo: 'responsable', fecha, autor: 'sistema', a: nuevo.responsableId });
        lista(a.leads, nuevo.sitioId).push(lead);
        return clon(lead);
      },
      async listar(sitioId, filtro = {}) {
        return clon(
          lista(a.leads, sitioId)
            .filter((l) => coincideFiltro(l, filtro))
            .sort((x, y) => y.creadoEl.localeCompare(x.creadoEl))
            .slice(0, filtro.limite ?? 500),
        );
      },
      async obtener(sitioId, id) {
        const l = lista(a.leads, sitioId).find((x) => x.id === id);
        return l ? clon(l) : null;
      },
      async actualizar(sitioId, id, cambios, autor) {
        const leads = lista(a.leads, sitioId);
        const i = leads.findIndex((x) => x.id === id);
        if (i < 0) throw new Error('Lead no encontrado.');
        leads[i] = aplicarCambiosLead(leads[i]!, cambios, autor);
        return clon(leads[i]!);
      },
    },

    cotizaciones: {
      async crear(nueva) {
        const sec = (a.secuencias.get(`cot_${nueva.sitioId}`) ?? 0) + 1;
        a.secuencias.set(`cot_${nueva.sitioId}`, sec);
        const c: Cotizacion = { ...clon(nueva), id: nuevoId('c_'), numero: numeroCotizacion(sec), estado: 'recibida', creadoEl: ahoraISO() };
        lista(a.cotizaciones, nueva.sitioId).push(c);
        return clon(c);
      },
      async listar(sitioId) {
        return clon([...lista(a.cotizaciones, sitioId)].sort((x, y) => y.creadoEl.localeCompare(x.creadoEl)));
      },
      async obtener(sitioId, id) {
        const c = lista(a.cotizaciones, sitioId).find((x) => x.id === id);
        return c ? clon(c) : null;
      },
      async marcarRevisada(sitioId, id) {
        const c = lista(a.cotizaciones, sitioId).find((x) => x.id === id);
        if (c) c.estado = 'revisada';
      },
    },

    citas: {
      async reservar(nueva) {
        // JavaScript ejecuta esto sin interrupciones: verificar + guardar es atómico aquí.
        const citas = lista(a.citas, nueva.sitioId);
        if (citaChoca(nueva, citas)) return { ok: false, motivo: 'ocupado' };
        const cita: Cita = { ...clon(nueva), id: nuevoId('t_'), estado: 'pendiente', creadoEl: ahoraISO() };
        citas.push(cita);
        return { ok: true, cita: clon(cita) };
      },
      async listarRango(sitioId, desde, hasta, profesionalId) {
        const d = Date.parse(desde), h = Date.parse(hasta);
        return clon(
          lista(a.citas, sitioId)
            .filter((c) => Date.parse(c.inicio) < h && Date.parse(c.fin) > d && (!profesionalId || c.profesionalId === profesionalId))
            .sort((x, y) => x.inicio.localeCompare(y.inicio)),
        );
      },
      async cambiarEstado(sitioId, id, estado) {
        const c = lista(a.citas, sitioId).find((x) => x.id === id);
        if (!c) throw new Error('Cita no encontrada.');
        c.estado = estado;
        return clon(c);
      },
    },

    archivos: {
      async subir(ruta, datos, tipo): Promise<ArchivoSubido> {
        a.archivos.set(ruta, { datos, tipo });
        return { ruta, url: `/api/archivos/${ruta}`, tipo, bytes: datos.byteLength };
      },
      async eliminar(ruta) {
        a.archivos.delete(ruta);
      },
    },

    colecciones: {
      async guardar(sitioId, coleccion, id, datos) {
        const k = `${sitioId}/${coleccion}`;
        if (!a.colecciones.has(k)) a.colecciones.set(k, new Map());
        a.colecciones.get(k)!.set(id, clon(datos));
        return clon(datos);
      },
      async leer(sitioId, coleccion, id) {
        const v = a.colecciones.get(`${sitioId}/${coleccion}`)?.get(id);
        return v ? (clon(v) as never) : null;
      },
      async listar(sitioId, coleccion) {
        return clon([...(a.colecciones.get(`${sitioId}/${coleccion}`)?.values() ?? [])]) as never;
      },
    },
  };
}

/** Lee un archivo subido en memoria (lo sirve la ruta /api/archivos/[...ruta]). */
export function leerArchivoMemoria(ruta: string) {
  return almacen().archivos.get(ruta) ?? null;
}
