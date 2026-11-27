'use client';

import * as React from 'react';

/**
 * Carrito de "Mi cotización" en localStorage (solo comodidad del visitante).
 * Guarda únicamente { productoId: cantidad }: los precios SIEMPRE salen del catálogo publicado.
 * Todo acceso a localStorage va en try/catch (modo privado, almacenamiento bloqueado…).
 */
const CLAVE = 'kz-cotizacion';
const EVENTO = 'kz-cotizacion-cambio';

export type Carrito = Record<string, number>;

export function leerCarrito(): Carrito {
  try {
    const crudo = JSON.parse(localStorage.getItem(CLAVE) ?? '{}') as unknown;
    if (!crudo || typeof crudo !== 'object') return {};
    return Object.fromEntries(
      Object.entries(crudo as Record<string, unknown>).filter(([, v]) => Number.isInteger(v) && (v as number) > 0) as [
        string,
        number,
      ][],
    );
  } catch {
    return {};
  }
}

export function guardarCarrito(c: Carrito) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(c));
  } catch {
    /* sin almacenamiento: el carrito vive solo en esta pestaña */
  }
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: c }));
}

export function agregarAlCarrito(productoId: string, cantidad = 1) {
  const c = leerCarrito();
  c[productoId] = Math.min((c[productoId] ?? 0) + cantidad, 9999);
  guardarCarrito(c);
}

/** Hook: carrito actual, sincronizado entre componentes y pestañas. */
export function useCarrito(): [Carrito, (c: Carrito) => void, boolean] {
  const [carrito, setCarrito] = React.useState<Carrito>({});
  const [listo, setListo] = React.useState(false);
  React.useEffect(() => {
    setCarrito(leerCarrito());
    setListo(true);
    const alCambiar = () => setCarrito(leerCarrito());
    window.addEventListener(EVENTO, alCambiar);
    window.addEventListener('storage', alCambiar);
    return () => {
      window.removeEventListener(EVENTO, alCambiar);
      window.removeEventListener('storage', alCambiar);
    };
  }, []);
  return [carrito, guardarCarrito, listo];
}
