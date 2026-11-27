import { expect, test } from '@playwright/test';
import { capturar, revisarAccesibilidad } from './ayudas';

test.skip(process.env.APP !== undefined && process.env.APP !== 'presentacion', 'Solo para APP=presentacion');

const APP = 'presentacion';

/**
 * Espera a que terminen las transiciones de entrada (`.k-aparecer`, opacidad 0 → 1 en 0,5 s) de lo
 * que está en pantalla. Sin esto axe mide el contraste a media animación y reporta falsos positivos.
 */

/**
 * Paso 8 de la plantilla 2 (docs/plantillas/02-presentacion.md): galería → filtro por sector →
 * detalle del caso → «Quiero algo así» → formulario con el caso indicado → lead con `extra.caso`.
 * Usa los casos de la semilla (semillas/presentacion/contenido.json) y solo datos ficticios.
 */
test('caso a lead', async ({ page }, info) => {
  const nombre = `Visitante Ficticio ${info.project.name} ${Date.now()}`;
  const correo = `visitante.${info.project.name}@ejemplo.test`;

  // 1. Portada con la galería de casos.
  await page.goto('/');
  await expect(page.getByText('Demo con datos ficticios').first()).toBeVisible();
  const galeria = page.locator('#casos');
  await expect(galeria.getByRole('heading', { name: 'Casos', level: 2 })).toBeVisible();
  await expect(galeria.getByRole('listitem')).toHaveCount(3);
  await revisarAccesibilidad(page, info, 'portada');
  await capturar(page, info, APP, 'portada');

  // 2. Filtro por sector: solo queda el caso de Salud.
  const filtro = galeria.getByRole('group', { name: 'Filtrar casos por sector' });
  await galeria.scrollIntoViewIfNeeded();
  await filtro.getByRole('button', { name: 'Salud' }).click();
  await expect(filtro.getByRole('button', { name: 'Salud' })).toHaveAttribute('aria-pressed', 'true');
  await expect(galeria.getByRole('listitem')).toHaveCount(1);
  await expect(galeria.getByRole('link', { name: /Reorganización de una planta de alimentos/ })).toHaveCount(0);
  await capturar(page, info, APP, 'filtro-salud');

  // 3. Detalle del caso generado desde el contenido.
  await galeria.getByRole('link', { name: /Agenda unificada para una red de clínicas/ }).click();
  await expect(page).toHaveURL(/\/casos\/red-clinicas$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Agenda unificada para una red de clínicas' }),
  ).toBeVisible();
  await expect(page.getByText('−28 % de inasistencias')).toBeVisible();
  await revisarAccesibilidad(page, info, 'detalle-caso');
  await capturar(page, info, APP, 'detalle-caso');

  // 4. «Quiero algo así» lleva al formulario con el caso indicado.
  await page.getByRole('link', { name: 'Quiero algo así' }).click();
  await expect(page).toHaveURL(/\/\?caso=red-clinicas#contacto$/);
  const contacto = page.locator('#contacto');
  await expect(contacto.getByText('Nos escribes por el caso:')).toBeVisible();
  await expect(contacto.getByText('Agenda unificada para una red de clínicas')).toBeVisible();
  const formulario = contacto.locator('form');
  await formulario.scrollIntoViewIfNeeded();
  await revisarAccesibilidad(page, info, 'formulario');
  await capturar(page, info, APP, 'formulario');

  // 5. Envío con datos ficticios y mensaje de éxito.
  await formulario.getByLabel(/^Nombre/).fill(nombre);
  await formulario.getByLabel(/^Correo/).fill(correo);
  await formulario.getByLabel(/^Teléfono/).fill('3000000004');
  await formulario.getByLabel(/^¿En qué te ayudamos\?/).fill('Mensaje de prueba con datos ficticios.');
  await formulario.getByRole('button', { name: 'Enviar' }).click();
  await expect(contacto.getByText('Gracias. Te escribimos en un día hábil para agendar una llamada.')).toBeVisible();
  await capturar(page, info, APP, 'lead-enviado');

  // 6. El lead aparece en /editar (Administrador) con el caso de origen.
  await page.goto('/editar');
  await page.getByRole('button', { name: 'Administrador' }).click();
  await page.getByRole('tab', { name: /Leads/ }).click();
  const lead = page.getByRole('listitem').filter({ hasText: nombre });
  await expect(lead).toBeVisible();
  await expect(lead.getByText(/caso-red-clinicas/)).toBeVisible();
  await expect(lead.getByText(/"caso": "red-clinicas"/)).toBeVisible();
  await capturar(page, info, APP, 'leads');
});
