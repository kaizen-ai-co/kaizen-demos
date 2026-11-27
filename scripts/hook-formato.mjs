#!/usr/bin/env node
/**
 * Hook PostToolUse de Claude Code (Edit|Write): formatea con Prettier SOLO el archivo editado.
 * Nunca bloquea: cualquier problema se ignora y sale con código 0.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { extname, isAbsolute, relative, resolve } from 'node:path';

const EXTS = new Set(['.ts', '.tsx', '.js', '.mjs', '.json', '.css', '.md']);

let entrada = '';
process.stdin.on('data', (d) => (entrada += d));
process.stdin.on('end', () => {
  try {
    const { tool_input: datos, cwd } = JSON.parse(entrada || '{}');
    const raiz = process.env.CLAUDE_PROJECT_DIR || cwd || process.cwd();
    const archivo = datos?.file_path ? resolve(raiz, datos.file_path) : null;
    if (!archivo || !existsSync(archivo) || !EXTS.has(extname(archivo).toLowerCase())) process.exit(0);
    const rel = relative(raiz, archivo);
    if (rel.startsWith('..') || isAbsolute(rel) || /(^|[\\/])(node_modules|\.next)[\\/]/.test(rel)) process.exit(0);
    const prettier = resolve(raiz, 'node_modules', 'prettier', 'bin', 'prettier.cjs');
    if (!existsSync(prettier)) process.exit(0);
    spawnSync(process.execPath, [prettier, '--write', '--ignore-unknown', rel], { cwd: raiz, stdio: 'ignore', timeout: 25000 });
  } catch {
    /* nunca bloquear la edición */
  }
  process.exit(0);
});
