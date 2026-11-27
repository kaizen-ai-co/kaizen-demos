#!/usr/bin/env node
/**
 * Hook Stop de Claude Code: al terminar un turno con cambios en código, corre typecheck + lint.
 * Si fallan, AVISA con systemMessage (no bloquea). Siempre sale con código 0.
 */
import { spawnSync } from 'node:child_process';

const RELEVANTE = /^(apps|packages|scripts|semillas)\/.+\.(ts|tsx|mjs|js)$|^(eslint\.config|tsconfig|package\.json)/;

let entrada = '';
process.stdin.on('data', (d) => (entrada += d));
process.stdin.on('end', () => {
  let datos = {};
  try {
    datos = JSON.parse(entrada || '{}');
  } catch {
    /* entrada vacía */
  }
  if (datos.stop_hook_active) process.exit(0); // evita bucles
  const cwd = process.env.CLAUDE_PROJECT_DIR || datos.cwd || process.cwd();
  const correr = (cmd) => spawnSync(cmd, { cwd, shell: true, encoding: 'utf8', timeout: 170000, maxBuffer: 1 << 24 });

  const estado = correr('git status --porcelain');
  if (estado.status === 0) {
    const cambiados = estado.stdout
      .split('\n')
      .map((l) => l.slice(3).trim().replace(/^"|"$/g, ''))
      .filter((f) => RELEVANTE.test(f));
    if (cambiados.length === 0) process.exit(0);
  }

  const fallas = [];
  const tipos = correr('npm run --silent typecheck');
  if (tipos.status !== 0) {
    const lineas = `${tipos.stdout}\n${tipos.stderr}`
      .replace(/\x1b\[[0-9;]*m/g, '')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => /error/i.test(l))
      .slice(0, 8);
    fallas.push(`typecheck:\n${lineas.join('\n') || '(ver npm run typecheck)'}`);
  }

  // lint en JSON para decir archivo:línea de cada error (solo errores, no avisos)
  const lint = correr('npx eslint . --quiet -f json');
  if (lint.status !== 0) {
    let lineas = [];
    try {
      lineas = JSON.parse(lint.stdout).flatMap((f) =>
        f.messages.map((m) => {
          const archivo = f.filePath.replace(/\\/g, '/').replace(/^.*?\/kaizen-demos\//, '');
          return `${archivo}:${m.line} ${m.ruleId ?? ''} — ${m.message.split('\n')[0].slice(0, 110)}`;
        }),
      );
    } catch {
      /* salida no JSON */
    }
    const total = lineas.length;
    fallas.push(
      `lint (${total} error(es)):\n${lineas.slice(0, 8).join('\n') || '(ver npm run lint)'}${total > 8 ? '\n…' : ''}`,
    );
  }
  if (fallas.length) {
    process.stdout.write(
      JSON.stringify({ systemMessage: `⚠ Revisión al cerrar el turno (no bloquea):\n${fallas.join('\n\n')}` }),
    );
  }
  process.exit(0);
});
