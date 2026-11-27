#!/usr/bin/env node
/**
 * Hook PostToolUse de Claude Code (ver .claude/settings.json).
 * Si se editó un esquema o una semilla, valida esa plantilla; si falla, devuelve
 * el error a Claude (código 2) para que lo corrija en el mismo turno.
 */
import { execFileSync } from 'node:child_process';

let entrada = '';
process.stdin.on('data', (d) => (entrada += d));
process.stdin.on('end', () => {
  let ruta = '';
  try {
    ruta = (JSON.parse(entrada)?.tool_input?.file_path ?? '').replace(/\\/g, '/');
  } catch {
    process.exit(0);
  }
  const esEsquema = /apps\/([^/]+)\/contenido\.schema\.json$/.exec(ruta);
  const esSemilla = /semillas\/([^/]+)\/.+\.json$/.exec(ruta);
  if (!esEsquema && !esSemilla) process.exit(0);
  const plantilla = (esEsquema ?? esSemilla)[1];
  try {
    execFileSync('npx', ['tsx', 'scripts/validar-esquemas.ts', plantilla], {
      stdio: 'pipe',
      shell: process.platform === 'win32',
    });
  } catch (e) {
    process.stderr.write(
      `Validación de esquema/semilla de "${plantilla}" falló:\n${e.stderr?.toString() ?? e.message}`,
    );
    process.exit(2);
  }
});
