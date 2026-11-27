import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Une clases de Tailwind resolviendo conflictos (convención de shadcn/ui). */
export function cn(...entradas: ClassValue[]) {
  return twMerge(clsx(entradas));
}

const formateadores = new Map<string, Intl.NumberFormat>();

/** Precio en pesos colombianos por defecto. Todos los precios de las demos son ficticios. */
export function formatearPrecio(valor: number, moneda = 'COP', locale = 'es-CO') {
  const clave = `${locale}|${moneda}`;
  if (!formateadores.has(clave)) {
    formateadores.set(
      clave,
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: moneda,
        maximumFractionDigits: moneda === 'COP' ? 0 : 2,
      }),
    );
  }
  return formateadores.get(clave)!.format(valor);
}

export function formatearFecha(
  iso: string,
  opciones: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' },
) {
  return new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', ...opciones }).format(new Date(iso));
}

/** Convierte un valor de imagen del contenido ({url, alt} o texto) en props seguras. */
export function img(valor: unknown, altPorDefecto = ''): { src: string; alt: string } | null {
  if (!valor) return null;
  if (typeof valor === 'string') return { src: valor, alt: altPorDefecto };
  const v = valor as { url?: string; alt?: string };
  return v.url ? { src: v.url, alt: v.alt ?? altPorDefecto } : null;
}

export const texto = (v: unknown, porDefecto = '') => (typeof v === 'string' ? v : porDefecto);
export const lista = <T = Record<string, unknown>>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
