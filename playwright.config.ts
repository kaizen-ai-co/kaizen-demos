import { defineConfig, devices } from '@playwright/test';

/**
 * Recorridos e2e. Cada corrida levanta UNA app (APP=comercial por defecto) en modo
 * memoria con cuentas de prueba, y la prueba en móvil y escritorio.
 *   APP=comercial npx playwright test
 */
const APP = process.env.APP ?? 'comercial';
const PUERTOS: Record<string, number> = { comercial: 3001, presentacion: 3002, catalogo: 3003, visor3d: 3004, panel: 3005, agenda: 3006 };
const puerto = PUERTOS[APP] ?? 3001;

export default defineConfig({
  testDir: 'pruebas/e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: `http://localhost:${puerto}`, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'movil', use: { ...devices['Pixel 7'], viewport: { width: 375, height: 812 } } },
    { name: 'escritorio', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: `npm run start -w @kaizen/app-${APP} -- --port ${puerto}`,
    url: `http://localhost:${puerto}/api/salud`,
    reuseExistingServer: !process.env.CI,
    env: { DATOS_PROVEEDOR: 'memoria', ENTRAR_COMO_PRUEBA: '1', NEXT_TELEMETRY_DISABLED: '1' },
  },
});
