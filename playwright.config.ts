import { defineConfig, devices } from '@playwright/test';

/**
 * Recorridos e2e. Cada corrida levanta UNA app (APP=comercial por defecto) en modo memoria con
 * cuentas de prueba (requiere el build de esa app) y la prueba en móvil (390) y escritorio (1440).
 *   APP=comercial npx playwright test pruebas/e2e/comercial.spec.ts pruebas/e2e/acceso.spec.ts
 * Variables:
 *   PUERTO_DESFASE=100  corre en 3101… para no chocar con un `npm run dev` abierto en 3001…
 *   REUSAR_SERVIDOR=1   reutiliza un servidor ya levantado (por defecto NO: así nunca se prueba
 *                       por error contra un `next dev` sin el modo memoria).
 */
const APP = process.env.APP ?? 'comercial';
const PUERTOS: Record<string, number> = {
  comercial: 3001,
  presentacion: 3002,
  catalogo: 3003,
  visor3d: 3004,
  panel: 3005,
  agenda: 3006,
};
const puerto = (PUERTOS[APP] ?? 3001) + Number(process.env.PUERTO_DESFASE ?? 0);

export default defineConfig({
  testDir: 'pruebas/e2e',
  outputDir: `test-results/${APP}`,
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: `http://localhost:${puerto}`, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'movil', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
    { name: 'escritorio', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: `npm run start -w @kaizen/app-${APP} -- --port ${puerto}`,
    url: `http://localhost:${puerto}/api/salud`,
    reuseExistingServer: process.env.REUSAR_SERVIDOR === '1',
    env: { DATOS_PROVEEDOR: 'memoria', ENTRAR_COMO_PRUEBA: '1', NEXT_TELEMETRY_DISABLED: '1' },
  },
});
