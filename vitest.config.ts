import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/*.test.ts', 'apps/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/.next/**'],
    environment: 'node',
    // Toda la lógica de fechas se prueba en la zona horaria del negocio.
    env: { TZ: 'America/Bogota' },
  },
});
