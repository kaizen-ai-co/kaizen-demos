import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore, type Firestore, type Transaction } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import type { CapaDatos } from '../interfaces';
import type { Cita, Cotizacion, Lead, Rol, Usuario, VersionContenido } from '../tipos';
import { ahoraISO, aplicarCambiosLead, citaChoca, coincideFiltro, nuevoId, numeroCotizacion } from '../utilidades';

/**
 * Proveedor Firebase (entorno de pruebas en Vercel).
 * - Identidad: Firebase Authentication con Google + cookie de sesión del Admin SDK.
 * - Datos: Firestore en `sitios/{sitioId}/...` y `usuarios/{correo}`.
 * - Archivos: Cloud Storage en `sitios/{sitioId}/publico/...`.
 *
 * Todo pasa por el servidor con el Admin SDK, y las reglas de `firestore.rules` y
 * `storage.rules` repiten los permisos como segunda barrera para cualquier acceso
 * directo desde el navegador.
 *
 * Estructura de documentos:
 *   usuarios/{correo}                         { correo, rol, activo, sitioId?, venceEl? }
 *   sitios/{sitioId}/contenido/borrador       VersionContenido
 *   sitios/{sitioId}/contenido/publicado      VersionContenido
 *   sitios/{sitioId}/contenido/v_<ms>_<id>    VersionContenido (archivado)
 *   sitios/{sitioId}/leads/{id}               Lead
 *   sitios/{sitioId}/cotizaciones/{id}        Cotizacion
 *   sitios/{sitioId}/citas/{id}               Cita
 *   sitios/{sitioId}/bloqueos/{prof}_{fecha}  candado de la transacción de reservas
 *   sitios/{sitioId}/{coleccion}/{id}         registros genéricos
 */

function app(): App {
  const existente = getApps()[0];
  if (existente) return existente;
  const crudo = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!crudo) throw new Error('Falta FIREBASE_SERVICE_ACCOUNT (JSON o base64). Ver .env.example.');
  const json = crudo.trim().startsWith('{') ? crudo : Buffer.from(crudo, 'base64').toString('utf8');
  const credencial = JSON.parse(json);
  return initializeApp({
    credential: cert(credencial),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

const sitio = (db: Firestore, sitioId: string) => db.collection('sitios').doc(sitioId);
const ROLES_VALIDOS: Rol[] = ['desarrollador', 'administrador', 'cliente'];
const quitarIndefinidos = <T>(x: T): T => JSON.parse(JSON.stringify(x));

export function crearCapaFirebase(): CapaDatos {
  const db = getFirestore(app());
  const auth = getAuth(app());
  const bucket = getStorage(app()).bucket();
  const diasSesion = Math.min(Number(process.env.SESION_DIAS ?? 5), 14);

  async function leerUsuario(correo: string): Promise<Usuario | null> {
    const snap = await db.collection('usuarios').doc(correo.toLowerCase()).get();
    return snap.exists ? (snap.data() as Usuario) : null;
  }

  return {
    proveedor: 'firebase',

    identidad: {
      async verificarSesion(credencial) {
        try {
          // `true` = comprueba revocación: revocar desde la consola corta la sesión al instante.
          const t = await auth.verifySessionCookie(credencial, true);
          const correo = (t.email ?? '').toLowerCase();
          const registro = await leerUsuario(correo);
          const rolClaim = t.rol as Rol | undefined;
          if (!registro || !rolClaim || !ROLES_VALIDOS.includes(rolClaim)) {
            return { uid: t.uid, correo, rol: 'ninguno' as never, activo: false };
          }
          // El claim manda; el registro confirma que sigue activo y aporta sitio/vencimiento.
          return {
            uid: t.uid,
            correo,
            nombre: t.name as string | undefined,
            rol: rolClaim,
            activo: registro.activo === true && registro.rol === rolClaim,
            sitioId: (t.sitioId as string | undefined) ?? registro.sitioId,
            venceEl: (t.venceEl as string | undefined) ?? registro.venceEl,
          };
        } catch {
          return null;
        }
      },
      async crearSesion(idToken) {
        await auth.verifyIdToken(idToken, true);
        const expiresIn = diasSesion * 24 * 60 * 60 * 1000;
        const credencial = await auth.createSessionCookie(idToken, { expiresIn });
        return { credencial, expiraEnSegundos: expiresIn / 1000 };
      },
      buscarUsuario: leerUsuario,
    },

    contenido: {
      async leerPublicado(sitioId) {
        const s = await sitio(db, sitioId).collection('contenido').doc('publicado').get();
        return s.exists ? (s.data() as never) : null;
      },
      async leerBorrador(sitioId) {
        const s = await sitio(db, sitioId).collection('contenido').doc('borrador').get();
        return s.exists ? (s.data() as never) : null;
      },
      async guardarBorrador(sitioId, datos, autor) {
        const v: VersionContenido = {
          id: 'borrador',
          sitioId,
          estado: 'borrador',
          datos,
          actualizadoPor: autor,
          actualizadoEl: ahoraISO(),
        };
        await sitio(db, sitioId).collection('contenido').doc('borrador').set(quitarIndefinidos(v));
        return v as never;
      },
      async publicar(sitioId, autor) {
        const col = sitio(db, sitioId).collection('contenido');
        return db.runTransaction(async (tx) => {
          const [b, p] = await Promise.all([tx.get(col.doc('borrador')), tx.get(col.doc('publicado'))]);
          if (!b.exists) throw new Error('No hay borrador para publicar.');
          const fecha = ahoraISO();
          if (p.exists) {
            const anterior = p.data() as VersionContenido;
            const id = `v_${Date.parse(anterior.publicadoEl ?? fecha)}_${nuevoId().slice(0, 4)}`;
            tx.set(col.doc(id), { ...anterior, id, estado: 'archivado' });
          }
          const publicado: VersionContenido = {
            ...(b.data() as VersionContenido),
            id: 'publicado',
            estado: 'publicado',
            publicadoPor: autor,
            publicadoEl: fecha,
          };
          tx.set(col.doc('publicado'), quitarIndefinidos(publicado));
          return publicado;
        });
      },
      async volverAtras(sitioId, autor) {
        const col = sitio(db, sitioId).collection('contenido');
        const previas = await col.where('estado', '==', 'archivado').orderBy('publicadoEl', 'desc').limit(1).get();
        const previaDoc = previas.docs[0];
        if (!previaDoc) return null;
        return db.runTransaction(async (tx) => {
          const actual = await tx.get(col.doc('publicado'));
          const fecha = ahoraISO();
          if (actual.exists) {
            const id = `v_${Date.now()}_${nuevoId().slice(0, 4)}`;
            tx.set(col.doc(id), { ...(actual.data() as VersionContenido), id, estado: 'archivado' });
          }
          const previa = previaDoc.data() as VersionContenido;
          const restaurada: VersionContenido = {
            ...previa,
            id: 'publicado',
            estado: 'publicado',
            publicadoPor: autor,
            publicadoEl: fecha,
          };
          tx.set(col.doc('publicado'), restaurada);
          tx.set(col.doc('borrador'), {
            ...restaurada,
            id: 'borrador',
            estado: 'borrador',
            actualizadoPor: autor,
            actualizadoEl: fecha,
          });
          tx.delete(previaDoc.ref);
          return restaurada;
        });
      },
      async historial(sitioId, limite = 20) {
        const q = await sitio(db, sitioId)
          .collection('contenido')
          .where('estado', 'in', ['publicado', 'archivado'])
          .get();
        return q.docs
          .map((d) => d.data() as VersionContenido)
          .sort((x, y) => (y.publicadoEl ?? '').localeCompare(x.publicadoEl ?? ''))
          .slice(0, limite);
      },
    },

    leads: {
      async crear(nuevo) {
        const fecha = ahoraISO();
        const ref = sitio(db, nuevo.sitioId).collection('leads').doc();
        const lead: Lead = {
          id: ref.id,
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
        if (nuevo.responsableId)
          lead.historial.push({ tipo: 'responsable', fecha, autor: 'sistema', a: nuevo.responsableId });
        await ref.set(quitarIndefinidos(lead));
        return lead;
      },
      async listar(sitioId, filtro = {}) {
        let q: FirebaseFirestore.Query = sitio(db, sitioId).collection('leads');
        if (filtro.etapa) q = q.where('etapa', '==', filtro.etapa);
        if (filtro.responsableId) q = q.where('responsableId', '==', filtro.responsableId);
        const snap = await q
          .orderBy('creadoEl', 'desc')
          .limit(filtro.limite ?? 500)
          .get();
        // El texto libre y el origen se filtran en memoria (volumen de demo).
        return snap.docs
          .map((d) => d.data() as Lead)
          .filter((l) => coincideFiltro(l, { origen: filtro.origen, texto: filtro.texto }));
      },
      async obtener(sitioId, id) {
        const s = await sitio(db, sitioId).collection('leads').doc(id).get();
        return s.exists ? (s.data() as Lead) : null;
      },
      async actualizar(sitioId, id, cambios, autor) {
        const ref = sitio(db, sitioId).collection('leads').doc(id);
        return db.runTransaction(async (tx) => {
          const s = await tx.get(ref);
          if (!s.exists) throw new Error('Lead no encontrado.');
          const siguiente = aplicarCambiosLead(s.data() as Lead, cambios, autor);
          tx.set(ref, quitarIndefinidos(siguiente));
          return siguiente;
        });
      },
    },

    cotizaciones: {
      async crear(nueva) {
        const s = sitio(db, nueva.sitioId);
        return db.runTransaction(async (tx) => {
          const contador = s.collection('contadores').doc('cotizaciones');
          const actual = await tx.get(contador);
          const sec = ((actual.data()?.valor as number | undefined) ?? 0) + 1;
          const ref = s.collection('cotizaciones').doc();
          const c: Cotizacion = {
            ...nueva,
            id: ref.id,
            numero: numeroCotizacion(sec),
            estado: 'recibida',
            creadoEl: ahoraISO(),
          };
          tx.set(contador, { valor: sec });
          tx.set(ref, quitarIndefinidos(c));
          return c;
        });
      },
      async listar(sitioId) {
        const q = await sitio(db, sitioId).collection('cotizaciones').orderBy('creadoEl', 'desc').limit(200).get();
        return q.docs.map((d) => d.data() as Cotizacion);
      },
      async obtener(sitioId, id) {
        const s = await sitio(db, sitioId).collection('cotizaciones').doc(id).get();
        return s.exists ? (s.data() as Cotizacion) : null;
      },
      async marcarRevisada(sitioId, id) {
        await sitio(db, sitioId).collection('cotizaciones').doc(id).update({ estado: 'revisada' });
      },
    },

    citas: {
      async reservar(nueva) {
        const s = sitio(db, nueva.sitioId);
        const fecha = nueva.inicio.slice(0, 10);
        // Candado por profesional y día: serializa las reservas que compiten por el mismo hueco.
        const candado = s.collection('bloqueos').doc(`${nueva.profesionalId}_${fecha}`);
        return db.runTransaction(async (tx: Transaction) => {
          await tx.get(candado);
          const finDelDia = new Date(Date.parse(nueva.fin) + 864e5).toISOString();
          const inicioDelDia = new Date(Date.parse(nueva.inicio) - 864e5).toISOString();
          const q = s
            .collection('citas')
            .where('profesionalId', '==', nueva.profesionalId)
            .where('inicio', '>=', inicioDelDia)
            .where('inicio', '<', finDelDia);
          const existentes = (await tx.get(q)).docs.map((d) => d.data() as Cita);
          if (citaChoca(nueva, existentes)) return { ok: false as const, motivo: 'ocupado' as const };
          const ref = s.collection('citas').doc();
          const cita: Cita = { ...nueva, id: ref.id, estado: 'pendiente', creadoEl: ahoraISO() };
          tx.set(ref, quitarIndefinidos(cita));
          tx.set(candado, { actualizado: FieldValue.serverTimestamp() });
          return { ok: true as const, cita };
        });
      },
      async listarRango(sitioId, desde, hasta, profesionalId) {
        let q: FirebaseFirestore.Query = sitio(db, sitioId).collection('citas').where('inicio', '<', hasta);
        if (profesionalId) q = q.where('profesionalId', '==', profesionalId);
        const snap = await q.orderBy('inicio').get();
        return snap.docs.map((d) => d.data() as Cita).filter((c) => Date.parse(c.fin) > Date.parse(desde));
      },
      async cambiarEstado(sitioId, id, estado) {
        const ref = sitio(db, sitioId).collection('citas').doc(id);
        await ref.update({ estado });
        return (await ref.get()).data() as Cita;
      },
    },

    archivos: {
      async subir(ruta, datos, tipo) {
        const archivo = bucket.file(ruta);
        await archivo.save(Buffer.from(datos), {
          contentType: tipo,
          resumable: false,
          metadata: { cacheControl: 'public, max-age=31536000' },
        });
        const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(ruta)}?alt=media`;
        return { ruta, url, tipo, bytes: datos.byteLength };
      },
      async eliminar(ruta) {
        await bucket.file(ruta).delete({ ignoreNotFound: true });
      },
    },

    colecciones: {
      async guardar(sitioId, coleccion, id, datos) {
        await sitio(db, sitioId).collection(coleccion).doc(id).set(quitarIndefinidos(datos));
        return datos;
      },
      async leer(sitioId, coleccion, id) {
        const s = await sitio(db, sitioId).collection(coleccion).doc(id).get();
        return s.exists ? (s.data() as never) : null;
      },
      async listar(sitioId, coleccion) {
        const q = await sitio(db, sitioId).collection(coleccion).limit(500).get();
        return q.docs.map((d) => d.data()) as never;
      },
    },
  };
}

/** Uso exclusivo de scripts/gestionar-usuario.ts con la cuenta oficial. */
export async function asignarRol(correo: string, datos: Omit<Usuario, 'uid' | 'correo'>) {
  const a = getAuth(app());
  const db = getFirestore(app());
  const usuario = await a.getUserByEmail(correo).catch(() => null);
  const claims = datos.activo ? { rol: datos.rol, sitioId: datos.sitioId ?? null, venceEl: datos.venceEl ?? null } : {};
  if (usuario) {
    await a.setCustomUserClaims(usuario.uid, claims);
    await a.revokeRefreshTokens(usuario.uid); // obliga a renovar el token con el rol nuevo
  }
  await db
    .collection('usuarios')
    .doc(correo.toLowerCase())
    .set(quitarIndefinidos({ correo: correo.toLowerCase(), ...datos }));
  return { existeEnAuth: !!usuario };
}
