import { expect, test } from '@playwright/test';
import { capturar, revisarAccesibilidad } from './ayudas';

test.skip(process.env.APP !== undefined && process.env.APP !== 'comercial', 'Solo para APP=comercial');

/** Paso 8 de la plantilla 1: formulario desde el móvil → lead visible en «Leads», con axe en cada paso. */
test('formulario a lead', async ({ page }, info) => {
  const nombre = `Visitante Ficticio ${info.project.name} ${Date.now()}`;
  await page.goto('/');
  await expect(page.getByText('Demo con datos ficticios').first()).toBeVisible();
  await revisarAccesibilidad(page, info, 'portada');
  await capturar(page, info, 'comercial', 'portada');

  const formulario = page.locator('#contacto form');
  await formulario.getByLabel('Nombre').fill(nombre);
  await formulario.getByLabel('WhatsApp').fill('+57 300 000 0042');
  await formulario.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByText('Recibimos tus datos')).toBeVisible();
  await revisarAccesibilidad(page, info, 'lead-enviado');
  await capturar(page, info, 'comercial', 'lead-enviado');

  await page.goto('/editar');
  await page.getByRole('button', { name: 'Administrador' }).click();
  await page.getByRole('tab', { name: /Leads/ }).click();
  await expect(page.getByText(nombre)).toBeVisible();
  await revisarAccesibilidad(page, info, 'editor-leads');
  await capturar(page, info, 'comercial', 'leads');
});
