import temaBase from '../tema.json';

export type Tema = typeof temaBase;
export type ClaveColor = keyof Tema['colores'];

/** Sobrescrituras parciales que el Desarrollador guarda por sitio (`_estructura.tema`). */
export interface SobrescriturasTema {
  colores?: Partial<Record<ClaveColor, string>>;
  coloresOscuro?: Partial<Record<ClaveColor, string>>;
  tipografia?: Partial<Tema['tipografia']>;
  radios?: Partial<Tema['radios']>;
}

export const tema: Tema = temaBase;

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/** Mezcla el tema base con las sobrescrituras del sitio. */
export function resolverTema(sobre?: SobrescriturasTema | null): Tema {
  if (!sobre) return tema;
  return {
    ...tema,
    colores: { ...tema.colores, ...(sobre.colores ?? {}) },
    coloresOscuro: { ...tema.coloresOscuro, ...(sobre.coloresOscuro ?? {}) },
    tipografia: { ...tema.tipografia, ...(sobre.tipografia ?? {}) },
    radios: { ...tema.radios, ...(sobre.radios ?? {}) },
  };
}

/** Variables CSS `--k-*` para :root (claro) y para el modo oscuro. */
export function temaAVariables(t: Tema): { claro: string; oscuro: string } {
  const lineas: string[] = [];
  for (const [k, v] of Object.entries(t.colores)) lineas.push(`--k-${kebab(k)}: ${v};`);
  for (const [k, v] of Object.entries(t.tipografia)) lineas.push(`--k-fuente-${kebab(k)}: ${v};`);
  for (const [k, v] of Object.entries(t.radios)) lineas.push(`--k-radio-${k}: ${v};`);
  for (const [k, v] of Object.entries(t.sombras)) lineas.push(`--k-sombra-${k}: ${v};`);
  for (const [k, v] of Object.entries(t.espaciados)) lineas.push(`--k-espacio-${kebab(k)}: ${v};`);
  const oscuro = Object.entries(t.coloresOscuro).map(([k, v]) => `--k-${kebab(k)}: ${v};`);
  return { claro: lineas.join(' '), oscuro: oscuro.join(' ') };
}

/** Hoja de estilo lista para inyectar en <style> desde el layout. */
export function temaACss(sobre?: SobrescriturasTema | null): string {
  const { claro, oscuro } = temaAVariables(resolverTema(sobre));
  return [
    `:root{${claro}}`,
    `@media (prefers-color-scheme: dark){:root:not([data-tema="claro"]){${oscuro}}}`,
    `:root[data-tema="oscuro"]{${oscuro}}`,
  ].join('\n');
}

// ── Contraste WCAG 2.x ────────────────────────────────────────────────
function canal(c: number) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminancia(hex: string): number {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((x) => x + x).join('') : h;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

export function contraste(a: string, b: string): number {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x) as [number, number];
  return Math.round(((l1 + 0.05) / (l2 + 0.05)) * 100) / 100;
}

/** Revisa los pares declarados en `paresContraste` para claro y oscuro. */
export function revisarContraste(t: Tema = tema, minimo = 4.5) {
  const fallas: { modo: 'claro' | 'oscuro'; par: [string, string]; valor: number }[] = [];
  for (const modo of ['claro', 'oscuro'] as const) {
    const paleta = (modo === 'claro' ? t.colores : t.coloresOscuro) as Record<string, string>;
    for (const [a, b] of t.paresContraste as [string, string][]) {
      const valor = contraste(paleta[a]!, paleta[b]!);
      if (valor < minimo) fallas.push({ modo, par: [a, b], valor });
    }
  }
  return fallas;
}
