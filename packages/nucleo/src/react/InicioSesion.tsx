'use client';

import { AvisoDemo, Aviso, Boton, Tarjeta } from '@kaizen/ui';
import * as React from 'react';

/**
 * Pantalla de entrada a /editar.
 * - modo "google": botón Entrar con Google (Firebase Auth en pruebas).
 * - modo "prueba": solo en local con DATOS_PROVEEDOR=memoria; permite probar las
 *   cuentas del paso 7 (Desarrollador, Administrador, Cliente y una no autorizada).
 */
const CUENTAS_PRUEBA = [
  { correo: 'desarrollador@kaizen.test', etiqueta: 'Desarrollador' },
  { correo: 'administrador@kaizen.test', etiqueta: 'Administrador' },
  { correo: 'cliente@kaizen.test', etiqueta: 'Cliente (14 días de prueba)' },
  { correo: 'nadie@kaizen.test', etiqueta: 'No autorizada' },
];

export function InicioSesion({
  modo,
  titulo,
  apiSesion = '/api/sesion',
}: {
  modo: 'google' | 'prueba';
  titulo: string;
  apiSesion?: string;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [cargando, setCargando] = React.useState(false);

  async function crearSesion(idToken: string) {
    const r = await fetch(apiSesion, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? 'No se pudo iniciar sesión.');
    window.location.reload();
  }

  async function google() {
    setCargando(true);
    setError(null);
    try {
      const { entrarConGoogle } = await import('@kaizen/datos/cliente-firebase');
      await crearSesion(await entrarConGoogle());
    } catch (e) {
      setError((e as Error).message);
      setCargando(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col bg-superficie">
      <AvisoDemo />
      <div className="flex flex-1 items-center justify-center p-4">
        <Tarjeta className="w-full max-w-sm text-center">
          <h1 className="text-xl">{titulo}</h1>
          <p className="mt-2 text-sm text-suave">Edita el contenido de esta demo. Solo cuentas autorizadas.</p>
          {modo === 'google' ? (
            <Boton className="mt-6 w-full" tamano="lg" onClick={google} disabled={cargando}>
              <svg aria-hidden viewBox="0 0 48 48" className="size-5">
                <path
                  fill="#FFC107"
                  d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
                />
                <path
                  fill="#FF3D00"
                  d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
                />
              </svg>
              {cargando ? 'Abriendo Google…' : 'Entrar con Google'}
            </Boton>
          ) : (
            <div className="mt-6 grid gap-2">
              <p className="text-xs text-suave">Modo local con datos en memoria. Elige una cuenta de prueba:</p>
              {CUENTAS_PRUEBA.map((c) => (
                <Boton
                  key={c.correo}
                  variante="borde"
                  onClick={() => crearSesion(`memoria:${c.correo}`).catch((e) => setError(e.message))}
                >
                  {c.etiqueta}
                </Boton>
              ))}
            </div>
          )}
          {error && (
            <Aviso tono="peligro" className="mt-4 text-left">
              {error}
            </Aviso>
          )}
        </Tarjeta>
      </div>
    </main>
  );
}

export function SinAcceso({
  mensaje,
  correo,
  apiSesion = '/api/sesion',
}: {
  mensaje: string;
  correo?: string;
  apiSesion?: string;
}) {
  return (
    <main className="flex min-h-dvh flex-col bg-superficie">
      <AvisoDemo />
      <div className="flex flex-1 items-center justify-center p-4">
        <Tarjeta className="w-full max-w-sm text-center">
          <h1 className="text-xl">Sin acceso</h1>
          <p className="mt-2 text-sm text-suave">{mensaje}</p>
          {correo && <p className="mt-1 text-xs text-suave">Cuenta: {correo}</p>}
          <Boton
            variante="borde"
            className="mt-6 w-full"
            onClick={async () => {
              await fetch(apiSesion, { method: 'DELETE' });
              window.location.reload();
            }}
          >
            Usar otra cuenta
          </Boton>
        </Tarjeta>
      </div>
    </main>
  );
}
