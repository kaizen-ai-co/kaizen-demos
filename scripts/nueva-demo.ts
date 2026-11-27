/**
 * Crea la capa de una demo de cliente sobre una plantilla y un sector.
 *
 *   npm run nueva-demo -- --plantilla comercial --sitio clinica-ejemplo --sector clinica
 *
 * 1. Crea semillas/<plantilla>/demos/<sitio>.json (parcial: solo lo propio del cliente).
 * 2. Lo registra en semillas/<plantilla>/index.ts (entre los marcadores).
 * 3. Imprime las variables de entorno para Vercel.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: { plantilla: { type: 'string' }, sitio: { type: 'string' }, sector: { type: 'string' } },
});
const { plantilla, sitio, sector } = values;
if (!plantilla || !sitio) {
  console.error('Uso: npm run nueva-demo -- --plantilla <comercial|presentacion|catalogo|visor3d|panel|agenda> --sitio <id> [--sector <sector>]');
  process.exit(1);
}
if (!/^[a-z0-9][a-z0-9-]{2,40}$/.test(sitio)) {
  console.error('El id del sitio va en minúsculas, números y guiones (3–41 caracteres).');
  process.exit(1);
}

const raiz = path.resolve(import.meta.dirname, '..');
const carpeta = path.join(raiz, 'semillas', plantilla);
if (!existsSync(path.join(carpeta, 'contenido.json'))) {
  console.error(`No existe la plantilla "${plantilla}" en semillas/.`);
  process.exit(1);
}
if (sector && !existsSync(path.join(carpeta, 'sectores', `${sector}.json`))) {
  console.error(`No existe el sector "${sector}" para ${plantilla}. Créalo primero en semillas/${plantilla}/sectores/.`);
  process.exit(1);
}

const archivoDemo = path.join(carpeta, 'demos', `${sitio}.json`);
mkdirSync(path.dirname(archivoDemo), { recursive: true });
if (existsSync(archivoDemo)) {
  console.error(`Ya existe ${path.relative(raiz, archivoDemo)}.`);
  process.exit(1);
}
writeFileSync(
  archivoDemo,
  JSON.stringify(
    {
      $sitio: sitio,
      $sector: sector ?? null,
      $comentario: 'Capa de la demo del cliente: escribe solo lo que cambia frente a la base y el sector. Datos ficticios siempre.',
    },
    null,
    2,
  ) + '\n',
);

const indice = path.join(carpeta, 'index.ts');
let ts = readFileSync(indice, 'utf8');
const variable = 'demo_' + sitio.replace(/-/g, '_');
if (!ts.includes('// </importaciones-demos>') || !ts.includes('// </demos>')) {
  console.warn(`⚠ ${path.relative(raiz, indice)} no tiene los marcadores; regístrala a mano:\n  import ${variable} from './demos/${sitio}.json';\n  demos: { '${sitio}': ${variable} }`);
} else {
  ts = ts
    .replace('// </importaciones-demos>', `import ${variable} from './demos/${sitio}.json';\n// </importaciones-demos>`)
    .replace('    // </demos>', `    '${sitio}': ${variable},\n    // </demos>`);
  writeFileSync(indice, ts);
}

console.log(`✓ Demo creada: ${path.relative(raiz, archivoDemo)}
Siguiente:
  1. redactor-demos llena el contenido en palabras del cliente.
  2. npm run validar:esquemas -- ${plantilla}
  3. Local:  SITIO_ID=${sitio}${sector ? ` SECTOR=${sector}` : ''} npm run dev:${plantilla}
  4. Vercel (proyecto apps/${plantilla}): SITIO_ID=${sitio}${sector ? `  SECTOR=${sector}` : ''}  DATOS_PROVEEDOR=firebase`);
