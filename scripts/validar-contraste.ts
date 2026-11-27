/**
 * Contraste WCAG del tema base y de los colores propios de cada demo (_estructura.tema.colores).
 * Mínimo 4.5:1 para texto normal.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { contraste, resolverTema, revisarContraste } from '../packages/tema/src/index';

const raiz = path.resolve(import.meta.dirname, '..');
const MINIMO = Number(process.env.CONTRASTE_MINIMO ?? 4.5);
let fallas = 0;

for (const f of revisarContraste(undefined, MINIMO)) {
  fallas++;
  console.error(`✗ tema.json (${f.modo}): ${f.par[0]} sobre ${f.par[1]} = ${f.valor}:1`);
}

const PARES: [string, string][] = [
  ['primarioTexto', 'primario'],
  ['acentoTexto', 'acento'],
  ['texto', 'fondo'],
];
for (const plantilla of readdirSync(path.join(raiz, 'semillas'))) {
  const carpeta = path.join(raiz, 'semillas', plantilla);
  if (!existsSync(path.join(carpeta, 'contenido.json'))) continue;
  const archivos = [
    'contenido.json',
    ...['sectores', 'demos'].flatMap((s) =>
      existsSync(path.join(carpeta, s)) ? readdirSync(path.join(carpeta, s)).map((x) => `${s}/${x}`) : [],
    ),
  ];
  for (const a of archivos.filter((x) => x.endsWith('.json'))) {
    const colores = JSON.parse(readFileSync(path.join(carpeta, a), 'utf8'))?._estructura?.tema?.colores;
    if (!colores) continue;
    const paleta = resolverTema({ colores }).colores as Record<string, string>;
    for (const [x, y] of PARES) {
      const v = contraste(paleta[x]!, paleta[y]!);
      if (v < MINIMO) {
        fallas++;
        console.error(`✗ semillas/${plantilla}/${a}: ${x} sobre ${y} = ${v}:1`);
      }
    }
  }
}

if (fallas) {
  console.error(`\n${fallas} par(es) bajo ${MINIMO}:1`);
  process.exit(1);
}
console.log(`✓ contraste ≥ ${MINIMO}:1 en tema y demos`);
