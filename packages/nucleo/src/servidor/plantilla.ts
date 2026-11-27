import 'server-only';
import {
  rolDeEdicion,
  tienePermiso,
  type CambiosLead,
  type CapaDatos,
  type NuevoLead,
  type Permiso,
  type Usuario,
} from '@kaizen/datos';
import { leerArchivoMemoria, obtenerCapaDatos } from '@kaizen/datos/servidor';
import {
  completarContenido,
  fusionarSeguro,
  seccionesVisibles,
  slug,
  validarContenido,
  type Contenido,
} from '@kaizen/editor';
import { crearLimitador } from '@kaizen/modulos/limite';
import { cookies } from 'next/headers';
import type { ConfigPlantilla } from '../config';
import { ErrorEntrada, ipDe, json, leerJson, limpiar, manejar } from './http';
import { COOKIE_SESION, accesoActual, exigir, usuarioActual } from './sesion';

type Ctx = { params: Promise<Record<string, string | string[]>> };

const TIPOS_IMAGEN: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};
const TIPOS_MODELO: Record<string, string> = {
  'model/gltf-binary': 'glb',
  'model/gltf+json': 'gltf',
  'application/octet-stream': 'glb',
};
const RESERVADOS = new Set(['nombre', 'correo', 'telefono', 'origen', 'extra', '_trampa', 'sitioId']);

/**
 * Conecta una plantilla a la base común. Uso en la app:
 *
 *   // lib/plantilla.ts
 *   export const plantilla = definirPlantilla({ plantilla: 'comercial', esquema, semilla, ... });
 *
 *   // app/api/editor/[accion]/route.ts
 *   export const { GET, PUT, POST } = plantilla.rutas.editor;
 */
export function definirPlantilla(config: ConfigPlantilla) {
  const limitador = crearLimitador();
  const sitioId = () => process.env.SITIO_ID ?? config.sitioPorDefecto;
  const capa = () => obtenerCapaDatos();

  /**
   * Siembra contenido y registros ficticios la primera vez (una sola vez por sitio).
   * Layout, metadatos y página piden contenido en paralelo en la primera visita: el
   * candado por sitio evita que siembren dos veces dentro del mismo proceso, y la marca
   * en `sistema/semilla` evita repetirlo entre procesos o reinicios.
   */
  const semillando = new Map<string, Promise<void>>();
  function asegurarSemilla(c: CapaDatos, id: string): Promise<void> {
    const enCurso = semillando.get(id);
    if (enCurso) return enCurso;
    const tarea = (async () => {
      if (await c.colecciones.leer(id, 'sistema', 'semilla')) return;
      await c.colecciones.guardar(id, 'sistema', 'semilla', {
        plantilla: config.plantilla,
        el: new Date().toISOString(),
      });
      if (!(await c.contenido.leerPublicado(id))) {
        await c.contenido.guardarBorrador(id, completarContenido(config.esquema, config.semilla), 'semilla');
        await c.contenido.publicar(id, 'semilla');
      }
      await config.sembrarDatos?.(c, id);
    })().catch((e) => {
      semillando.delete(id); // si falla, se reintenta en la próxima visita
      throw e;
    });
    semillando.set(id, tarea);
    return tarea;
  }

  /**
   * Contenido para pintar una página. Público = publicado. Con `?vista=borrador`
   * y una sesión con permiso, devuelve el borrador (para la vista previa del editor).
   */
  async function obtenerContenido(opciones: { vista?: string | string[] } = {}) {
    const c = await capa();
    const id = sitioId();
    await asegurarSemilla(c, id);
    let estado: 'publicado' | 'borrador' | 'semilla' = 'publicado';
    let version = null as Awaited<ReturnType<CapaDatos['contenido']['leerPublicado']>>;
    if (opciones.vista === 'borrador') {
      const acceso = await accesoActual(id);
      if (acceso.ok && tienePermiso(acceso.usuario, 'contenido:leer-borrador')) {
        version = await c.contenido.leerBorrador(id);
        if (version) estado = 'borrador';
      }
    }
    version ??= await c.contenido.leerPublicado(id);
    if (!version) estado = 'semilla';
    const datos = completarContenido(config.esquema, (version?.datos as Contenido) ?? config.semilla);
    return { datos, estado, sitioId: id, secciones: seccionesVisibles(config.esquema, datos) };
  }

  async function contenidoActualParaEditar(c: CapaDatos, id: string): Promise<Contenido> {
    const v = (await c.contenido.leerBorrador(id)) ?? (await c.contenido.leerPublicado(id));
    return completarContenido(config.esquema, (v?.datos as Contenido) ?? config.semilla);
  }

  // ── /api/editor/[accion] ─────────────────────────────────────────────
  const editor = {
    GET: manejar(async (_req: Request, { params }: Ctx) => {
      const { accion } = await params;
      const id = sitioId();
      const c = await capa();
      await exigir(id, 'contenido:leer-borrador');
      if (accion === 'borrador') return json({ datos: await contenidoActualParaEditar(c, id) });
      if (accion === 'historial') return json(await c.contenido.historial(id));
      throw new ErrorEntrada('Acción desconocida.', 404);
    }),
    PUT: manejar(async (req: Request, { params }: Ctx) => {
      const { accion } = await params;
      if (accion !== 'borrador') throw new ErrorEntrada('Acción desconocida.', 404);
      const id = sitioId();
      const usuario = await exigir(id, 'contenido:editar');
      const { datos } = await leerJson<{ datos: Contenido }>(req, 2_000_000);
      if (!datos || typeof datos !== 'object') throw new ErrorEntrada('Falta "datos".');
      const c = await capa();
      const anterior = await contenidoActualParaEditar(c, id);
      // El servidor restaura todo lo que el rol no puede tocar, aunque la petición venga manipulada.
      const seguro = fusionarSeguro(config.esquema, rolDeEdicion(usuario.rol), anterior, datos);
      await c.contenido.guardarBorrador(id, seguro, usuario.correo);
      return json({ ok: true, errores: validarContenido(config.esquema, seguro).length });
    }),
    POST: manejar(async (_req: Request, { params }: Ctx) => {
      const { accion } = await params;
      const id = sitioId();
      const c = await capa();
      if (accion === 'publicar') {
        const usuario = await exigir(id, 'contenido:publicar');
        const borrador = await c.contenido.leerBorrador(id);
        if (!borrador) throw new ErrorEntrada('No hay cambios para publicar.', 409);
        const errores = validarContenido(
          config.esquema,
          completarContenido(config.esquema, borrador.datos as Contenido),
        );
        if (errores.length) throw new ErrorEntrada(`El contenido tiene ${errores.length} error(es).`, 422, errores);
        const v = await c.contenido.publicar(id, usuario.correo);
        return json({ ok: true, publicadoPor: v.publicadoPor, publicadoEl: v.publicadoEl });
      }
      if (accion === 'volver') {
        const usuario = await exigir(id, 'contenido:publicar');
        const v = await c.contenido.volverAtras(id, usuario.correo);
        if (!v) throw new ErrorEntrada('No hay una versión anterior para restaurar.', 409);
        return json({ ok: true, datos: v.datos, publicadoPor: v.publicadoPor, publicadoEl: v.publicadoEl });
      }
      throw new ErrorEntrada('Acción desconocida.', 404);
    }),
  };

  // ── /api/sesion ──────────────────────────────────────────────────────
  const sesion = {
    POST: manejar(async (req: Request) => {
      const { idToken } = await leerJson<{ idToken?: string }>(req);
      if (!idToken) throw new ErrorEntrada('Falta idToken.');
      const c = await capa();
      if (c.proveedor === 'memoria' && (process.env.ENTRAR_COMO_PRUEBA !== '1' || process.env.VERCEL === '1')) {
        throw new ErrorEntrada('Las cuentas de prueba solo funcionan en local.', 422);
      }
      const { credencial, expiraEnSegundos } = await c.identidad.crearSesion(idToken);
      (await cookies()).set(COOKIE_SESION, credencial, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: expiraEnSegundos,
      });
      return json({ ok: true });
    }),
    DELETE: manejar(async () => {
      (await cookies()).delete(COOKIE_SESION);
      return json({ ok: true });
    }),
  };

  // ── /api/leads (POST público, GET protegido) ────────────────────────
  const leads = {
    POST: manejar(async (req: Request) => {
      const cuerpo = await leerJson<Record<string, unknown>>(req, 20_000);
      // Campo trampa: un bot lo llena. Respondemos "ok" sin guardar para no darle pistas.
      if (limpiar(cuerpo._trampa)) return json({ ok: true, id: 'descartado' });
      const permitido = limitador.permitir(`lead:${ipDe(req)}`);
      if (!permitido.ok)
        throw new ErrorEntrada(
          `Demasiados envíos. Intenta de nuevo en ${Math.ceil((permitido.reintentarEnSeg ?? 60) / 60)} min.`,
          429,
        );

      const nombre = limpiar(cuerpo.nombre, 120);
      const correo = limpiar(cuerpo.correo, 160).toLowerCase();
      const telefono = limpiar(cuerpo.telefono, 30);
      if (!nombre) throw new ErrorEntrada('Escribe tu nombre.', 422);
      if (!correo && !telefono) throw new ErrorEntrada('Deja un correo o un teléfono.', 422);
      if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) throw new ErrorEntrada('Revisa el correo.', 422);
      if (telefono && !/^[+()\d\s-]{7,20}$/.test(telefono)) throw new ErrorEntrada('Revisa el teléfono.', 422);

      const campos: Record<string, string> = {};
      for (const [k, v] of Object.entries(cuerpo)) {
        if (RESERVADOS.has(k) || Object.keys(campos).length >= 20) continue;
        if (/^[a-zA-Z][a-zA-Z0-9_]{0,40}$/.test(k)) campos[k] = limpiar(v, 2000);
      }
      const extra =
        cuerpo.extra && typeof cuerpo.extra === 'object' ? (cuerpo.extra as Record<string, unknown>) : undefined;
      if (extra && JSON.stringify(extra).length > 8000)
        throw new ErrorEntrada('Datos adicionales demasiado grandes.', 422);

      const c = await capa();
      const id = sitioId();
      let nuevo: NuevoLead = {
        sitioId: id,
        nombre,
        contacto: { correo: correo || undefined, telefono: telefono || undefined },
        origen: slug(limpiar(cuerpo.origen, 60)) || 'formulario-web',
        campos,
        extra,
      };
      if (config.antesDeCrearLead) {
        const { datos } = await obtenerContenido();
        nuevo = await config.antesDeCrearLead(nuevo, c, datos);
      }
      const lead = await c.leads.crear(nuevo);
      await config.despuesDeCrearLead?.(lead, c).catch((e) => console.error('[kaizen] despuesDeCrearLead', e));
      return json({ ok: true, id: lead.id }, 201);
    }),
    GET: manejar(async (req: Request) => {
      const id = sitioId();
      await exigir(id, 'leads:leer');
      const q = new URL(req.url).searchParams;
      const c = await capa();
      return json(
        await c.leads.listar(id, {
          etapa: q.get('etapa') ?? undefined,
          responsableId: q.get('responsable') ?? undefined,
          origen: q.get('origen') ?? undefined,
          texto: q.get('q') ?? undefined,
        }),
      );
    }),
  };

  // ── /api/leads/[id] ──────────────────────────────────────────────────
  const lead = {
    GET: manejar(async (_req: Request, { params }: Ctx) => {
      const { id: leadId } = await params;
      const id = sitioId();
      await exigir(id, 'leads:leer');
      const l = await (await capa()).leads.obtener(id, String(leadId));
      if (!l) throw new ErrorEntrada('Lead no encontrado.', 404);
      return json(l);
    }),
    PATCH: manejar(async (req: Request, { params }: Ctx) => {
      const { id: leadId } = await params;
      const id = sitioId();
      const usuario = await exigir(id, 'leads:gestionar');
      const cuerpo = await leerJson<CambiosLead>(req);
      const cambios: CambiosLead = {};
      if (typeof cuerpo.etapa === 'string') cambios.etapa = limpiar(cuerpo.etapa, 60);
      if (typeof cuerpo.responsableId === 'string') cambios.responsableId = limpiar(cuerpo.responsableId, 60);
      if (typeof cuerpo.nota === 'string') cambios.nota = limpiar(cuerpo.nota, 2000);
      const l = await (await capa()).leads.actualizar(id, String(leadId), cambios, usuario.correo);
      return json(l);
    }),
  };

  // ── /api/archivos (subida protegida) y /api/archivos/[...ruta] (memoria) ──
  const archivos = {
    POST: manejar(async (req: Request) => {
      const id = sitioId();
      await exigir(id, 'archivos:subir');
      const fd = await req.formData();
      const archivo = fd.get('archivo');
      const carpeta = fd.get('carpeta') === 'modelos' ? 'modelos' : 'imagenes';
      if (!(archivo instanceof File)) throw new ErrorEntrada('Falta el archivo.');
      const ext = archivo.name.split('.').pop()?.toLowerCase() ?? '';
      const tipos = carpeta === 'modelos' ? TIPOS_MODELO : TIPOS_IMAGEN;
      const extension =
        tipos[archivo.type] ?? (carpeta === 'modelos' && (ext === 'glb' || ext === 'gltf') ? ext : null);
      if (!extension)
        throw new ErrorEntrada(
          carpeta === 'modelos' ? 'Sube un modelo .glb o .gltf.' : 'Sube una imagen PNG, JPG, WEBP, AVIF o GIF.',
          422,
        );
      const limite =
        carpeta === 'modelos' ? (config.limitesArchivos?.modelos ?? 15e6) : (config.limitesArchivos?.imagenes ?? 2e6);
      if (archivo.size > limite) throw new ErrorEntrada(`El archivo supera ${(limite / 1e6).toFixed(0)} MB.`, 422);
      const base = slug(archivo.name.replace(/\.[^.]+$/, '')) || 'archivo';
      const ruta = `sitios/${id}/publico/${carpeta}/${Date.now()}-${base}.${extension}`;
      const subido = await (
        await capa()
      ).archivos.subir(ruta, new Uint8Array(await archivo.arrayBuffer()), archivo.type || 'application/octet-stream');
      return json(subido, 201);
    }),
  };

  const archivo = {
    GET: manejar(async (_req: Request, { params }: Ctx) => {
      const { ruta } = await params;
      const r = Array.isArray(ruta) ? ruta.join('/') : String(ruta);
      if (!r.includes('/publico/')) throw new ErrorEntrada('No encontrado.', 404);
      const a = leerArchivoMemoria(r);
      if (!a) throw new ErrorEntrada('No encontrado.', 404);
      return new Response(new Uint8Array(a.datos), {
        headers: { 'content-type': a.tipo, 'cache-control': 'public, max-age=3600' },
      });
    }),
  };

  return {
    config,
    sitioId,
    capa,
    obtenerContenido,
    asegurarSemilla,
    usuarioActual,
    accesoActual: () => accesoActual(sitioId()),
    exigir: (permiso: Permiso): Promise<Usuario> => exigir(sitioId(), permiso),
    rutas: { editor, sesion, leads, lead, archivos, archivo },
  };
}

export type Plantilla = ReturnType<typeof definirPlantilla>;
