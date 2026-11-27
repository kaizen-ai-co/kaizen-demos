/**
 * Cada archivo de apps/<app>/public debe estar anotado en LICENCIAS.md (o en
 * apps/<app>/LICENCIAS-RECURSOS.md) por nombre de archivo.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const raiz = path.resolve(import.meta.dirname, '..');
const general = readFileSync(path.join(raiz, 'LICENCIAS.md'), 'utf8');
let faltan = 0;

function recorrer(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n);
    return statSync(p).isDirectory() ? recorrer(p) : [p];
  });
}

for (const app of readdirSync(path.join(raiz, 'apps'))) {
  const propio = path.join(raiz, 'apps', app, 'LICENCIAS-RECURSOS.md');
  const texto = general + (existsSync(propio) ? readFileSync(propio, 'utf8') : '');
  for (const archivo of recorrer(path.join(raiz, 'apps', app, 'public'))) {
    const nombre = path.basename(archivo);
    if (!texto.includes(nombre)) {
      faltan++;
      console.error(`✗ apps/${app}/public/…/${nombre} no está en LICENCIAS.md`);
    }
  }
}

if (faltan) {
  console.error(`\n${faltan} recurso(s) sin licencia anotada. Agrega origen, licencia, fecha y atribución.`);
  process.exit(1);
}
console.log('✓ todos los recursos públicos tienen licencia anotada');
