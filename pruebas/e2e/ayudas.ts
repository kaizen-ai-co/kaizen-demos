import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, type TestInfo } from '@playwright/test';

/**
 * Revisión automática de accesibilidad (WCAG 2.2 A/AA) con axe en el estado actual de la página.
 * Falla si hay violaciones serias o críticas (umbral de docs/calidad.md) y adjunta el detalle al
 * reporte. `excluir` acepta selectores de zonas que no son del sitio (p. ej. el canvas 3D).
 */
export async function revisarAccesibilidad(page: Page, info: TestInfo, nombre: string, excluir: string[] = []) {
  // axe mide colores: si una animación de entrada (opacidad) sigue en curso, da falsos «color-contrast».
  await esperarAnimaciones(page);
  let axe = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']);
  for (const s of excluir) axe = axe.exclude(s);
  const { violations } = await axe.analyze();
  const graves = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  await info.attach(`axe-${nombre}.json`, {
    body: JSON.stringify(violations, null, 2),
    contentType: 'application/json',
  });
  const resumen = graves.map((v) => `${v.impact} · ${v.id}: ${v.help} (${v.nodes.length} nodo/s)`).join('\n');
  expect(graves, `axe en «${nombre}»:\n${resumen}`).toEqual([]);
}

/** Espera a que no haya animaciones CSS/Web en curso (p. ej. el fundido de `Aparecer`). */
export async function esperarAnimaciones(page: Page) {
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== 'running' && a.playState !== 'pending'),
  );
}

/** Captura de evidencia en capturas/<app>/<proyecto>-<paso>.png (carpeta ignorada por git). */
export async function capturar(page: Page, info: TestInfo, app: string, paso: string, completa = false) {
  await page.screenshot({ path: `capturas/${app}/${info.project.name}-${paso}.png`, fullPage: completa });
}
