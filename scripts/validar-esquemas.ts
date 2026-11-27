/**
 * Valida cada contenido.schema.json y todas sus semillas (base, sectores y demos).
 *   npm run validar:esquemas            → todo
 *   npm run validar:esquemas -- catalogo → una plantilla
 * Sale con código 1 si hay problemas (lo usan la CI y el hook de Claude Code).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import {
  completarContenido,
  revisarEsquema,
  validarContenido,
  type Contenido,
  type EsquemaContenido,
} from '../packages/editor/src/index';
import { mezclar } from '../semillas/resolver';

/** Tipos de campo propios registrados por las apps con registrarControl(). */
export const TIPOS_PROPIOS = ['horarioSemanal', 'vistaCamara', 'tablaProductos'];

const raiz = path.resolve(import.meta.dirname, '..');
const filtro = process.argv[2];
const leer = (f: string) => JSON.parse(readFileSync(f, 'utf8'));
let problemas = 0;

const reportar = (donde: string, lista: string[]) => {
  if (!lista.length) return;
  problemas += lista.length;
  console.error(`\n✗ ${donde}`);
  for (const p of lista) console.error(`  · ${p}`);
};

for (const app of readdirSync(path.join(raiz, 'apps'))) {
  if (filtro && app !== filtro) continue;
  const archivoEsquema = path.join(raiz, 'apps', app, 'contenido.schema.json');
  if (!existsSync(archivoEsquema)) {
    reportar(`apps/${app}`, ['Falta contenido.schema.json']);
    continue;
  }
  const esquema = leer(archivoEsquema) as EsquemaContenido;
  reportar(`apps/${app}/contenido.schema.json`, revisarEsquema(esquema, TIPOS_PROPIOS));

  const carpeta = path.join(raiz, 'semillas', esquema.plantilla);
  const archivoBase = path.join(carpeta, 'contenido.json');
  if (!existsSync(archivoBase)) {
    reportar(`semillas/${esquema.plantilla}`, ['Falta contenido.json']);
    continue;
  }
  const base = leer(archivoBase);
  const capas: [string, Record<string, unknown>][] = [['contenido.json', base]];
  for (const sub of ['sectores', 'demos']) {
    const dir = path.join(carpeta, sub);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.json')))
      capas.push([`${sub}/${f}`, mezclar(base, leer(path.join(dir, f)))]);
  }
  for (const [nombre, datos] of capas) {
    const errores = validarContenido(esquema, completarContenido(esquema, datos as Contenido));
    reportar(
      `semillas/${esquema.plantilla}/${nombre}`,
      errores.map((e) => `${e.ruta}: ${e.mensaje}`),
    );
  }
  if (!problemas) console.log(`✓ ${app}: esquema y ${capas.length} semilla(s) válidos`);
}

if (problemas) {
  console.error(`\n${problemas} problema(s). Corrige el esquema o la semilla antes de continuar.`);
  process.exit(1);
}
