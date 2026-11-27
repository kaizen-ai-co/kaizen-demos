import { ErrorAcceso } from '@kaizen/datos';
import { NextResponse } from 'next/server';

export const json = (cuerpo: unknown, estado = 200, encabezados?: HeadersInit) =>
  NextResponse.json(cuerpo, { status: estado, headers: { 'cache-control': 'no-store', ...(encabezados ?? {}) } });

/** Envuelve un handler: ErrorAcceso → 401/403, error de validación → 400/422, resto → 500. */
export function manejar<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof ErrorAcceso)
        return json({ error: e.estado === 401 ? 'Inicia sesión.' : 'Sin acceso.', motivo: e.motivo }, e.estado);
      if (e instanceof ErrorEntrada) return json({ error: e.message, detalles: e.detalles }, e.estado);
      console.error('[kaizen] error en ruta', e);
      return json({ error: 'Error interno.' }, 500);
    }
  };
}

export class ErrorEntrada extends Error {
  constructor(
    mensaje: string,
    public estado: 400 | 404 | 409 | 422 | 429 = 400,
    public detalles?: unknown,
  ) {
    super(mensaje);
  }
}

/** IP del visitante para el límite de envíos (detrás de Vercel/Cloudflare/ALB). */
export function ipDe(req: Request): string {
  const h = req.headers;
  return (h.get('cf-connecting-ip') ?? h.get('x-forwarded-for')?.split(',')[0] ?? h.get('x-real-ip') ?? 'local').trim();
}

export async function leerJson<T = Record<string, unknown>>(req: Request, maxBytes = 100_000): Promise<T> {
  const texto = await req.text();
  if (texto.length > maxBytes) throw new ErrorEntrada('Solicitud demasiado grande.', 422);
  try {
    return JSON.parse(texto || '{}') as T;
  } catch {
    throw new ErrorEntrada('JSON inválido.');
  }
}

/** Limpia texto libre de un visitante. */
export function limpiar(v: unknown, max = 500): string {
  return typeof v === 'string'
    ? v
        .replace(/[\u0000-\u001f\u007f]/g, ' ')
        .trim()
        .slice(0, max)
    : '';
}
