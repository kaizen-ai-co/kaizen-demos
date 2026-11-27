// Chequeo de salud para el contenedor (Docker HEALTHCHECK, balanceadores).
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json({ ok: true, plantilla: 'visor3d', proveedor: process.env.DATOS_PROVEEDOR ?? 'memoria' });
}
