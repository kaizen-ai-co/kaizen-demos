import { expect, test, type Page } from '@playwright/test';
import { capturar, revisarAccesibilidad } from './ayudas';

test.skip(process.env.APP !== undefined && process.env.APP !== 'catalogo', 'Solo para APP=catalogo');

/** Tarjeta del catálogo (li) que contiene el producto. */
const tarjeta = (page: Page, nombre: string) =>
  page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: nombre }) });

async function agregarDesdeCatalogo(page: Page, nombre: string) {
  const t = tarjeta(page, nombre);
  await t.getByRole('button', { name: 'Agregar a la cotización' }).click();
  await expect(t.getByRole('button', { name: 'Agregado' })).toBeVisible();
}

/**
 * Paso 8 de la plantilla 3 (docs/plantillas/03-catalogo.md): catálogo → filtro y búsqueda →
 * detalle → 3 productos con cantidades → «Recibir mi cotización» → totales en pantalla → PDF →
 * la cotización aparece en /editar «Cotizaciones» con el mismo total.
 * 4 resmas (18.900) + 2 jabones (32.500) + 3 cafés (24.800) = 215.000 + IVA 19 % 40.850 = 255.850.
 */
test('catálogo a cotización con PDF y registro en el editor', async ({ page }, info) => {
  const nombre = `Comprador Ficticio ${info.project.name} ${Date.now()}`;

  // 1. Catálogo
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Arma tu cotización en dos minutos' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Resma de papel carta' })).toBeVisible();
  await revisarAccesibilidad(page, info, 'catalogo');
  await capturar(page, info, 'catalogo', '01-catalogo');

  // 2. Filtro por categoría
  const filtros = page.getByRole('group', { name: 'Filtrar por categoría' });
  await filtros.getByRole('button', { name: 'Oficina' }).click();
  await expect(filtros.getByRole('button', { name: 'Oficina' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name: 'Resma de papel carta' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Jabón líquido para manos' })).toHaveCount(0);
  await agregarDesdeCatalogo(page, 'Resma de papel carta');
  await capturar(page, info, 'catalogo', '02-filtro-oficina');

  // 3. Búsqueda (sin tildes encuentra con tildes) sobre «Todas»
  await filtros.getByRole('button', { name: 'Todas' }).click();
  await page.getByRole('searchbox', { name: 'Buscar productos' }).fill('jabon');
  await expect(page.getByRole('heading', { name: 'Jabón líquido para manos' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Resma de papel carta' })).toHaveCount(0);
  await agregarDesdeCatalogo(page, 'Jabón líquido para manos');
  await capturar(page, info, 'catalogo', '03-busqueda');

  await page.getByRole('searchbox', { name: 'Buscar productos' }).fill('producto que no existe');
  await expect(page.getByText('No encontramos productos con ese filtro.')).toBeVisible();
  await page.getByRole('searchbox', { name: 'Buscar productos' }).fill('');

  // Producto agotado: no se puede agregar
  await expect(tarjeta(page, 'Toallas de papel').getByRole('button', { name: 'No disponible' })).toBeDisabled();

  // 4. Detalle de producto
  await page.getByRole('link', { name: 'Café molido 500 g', exact: true }).click();
  await expect(page).toHaveURL(/\/productos\/cafe-500$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Café molido 500 g' })).toBeVisible();
  await revisarAccesibilidad(page, info, 'detalle');
  await page.getByRole('button', { name: 'Agregar a la cotización' }).click();
  await expect(page.getByRole('button', { name: 'Agregado' })).toBeVisible();
  await capturar(page, info, 'catalogo', '04-detalle');

  // 5. Mi cotización: ajustar cantidades
  await page.getByRole('link', { name: 'Ver mi cotización' }).click();
  await expect(page).toHaveURL(/\/cotizacion$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Mi cotización' })).toBeVisible();
  await page.getByRole('spinbutton', { name: 'Cantidad de Resma de papel carta' }).fill('4');
  await page.getByRole('button', { name: 'Agregar una unidad de Jabón líquido para manos' }).click();
  await page.getByRole('spinbutton', { name: 'Cantidad de Café molido 500 g' }).fill('3');
  await expect(page.getByRole('spinbutton', { name: 'Cantidad de Resma de papel carta' })).toHaveValue('4');
  await expect(page.getByRole('spinbutton', { name: 'Cantidad de Jabón líquido para manos' })).toHaveValue('2');
  await expect(page.getByRole('spinbutton', { name: 'Cantidad de Café molido 500 g' })).toHaveValue('3');
  const productos = page.getByRole('region', { name: 'Productos de la cotización' });
  await expect(productos.getByText(/215\.000/)).toBeVisible();
  await expect(productos.getByText(/255\.850/)).toBeVisible();
  await revisarAccesibilidad(page, info, 'cotizacion');
  await capturar(page, info, 'catalogo', '05-cotizacion', true);

  // 6. Datos ficticios: primero el error junto al formulario, luego el envío
  const datos = page.getByRole('region', { name: 'Tus datos' });
  await datos.getByRole('button', { name: 'Recibir mi cotización' }).click();
  await expect(datos.getByText('Escribe tu nombre.')).toBeVisible();
  await datos.getByLabel('Nombre').fill(nombre);
  await datos.getByLabel('Empresa').fill('Empresa Ejemplo (ficticia)');
  await datos.getByLabel('Correo').fill('comprador@ejemplo.test');
  await datos.getByLabel('Teléfono').fill('3000000004');
  await capturar(page, info, 'catalogo', '06-datos');
  await datos.getByRole('button', { name: 'Recibir mi cotización' }).click();

  // 7. Cotización generada en pantalla con totales
  await expect(page.getByText('¡Listo! Esta es tu cotización. También puedes descargarla en PDF.')).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: /^Cotización / })).toBeVisible();
  await expect(page.getByText('4 × Resma de papel carta')).toBeVisible();
  await expect(page.getByText('2 × Jabón líquido para manos')).toBeVisible();
  await expect(page.getByText('3 × Café molido 500 g')).toBeVisible();
  await expect(page.getByText(/40\.850/)).toBeVisible();
  await expect(page.getByText(/255\.850/)).toBeVisible();
  await revisarAccesibilidad(page, info, 'resultado');
  await capturar(page, info, 'catalogo', '07-resultado', true);

  // 8. «Descargar PDF» responde un PDF
  const href = await page.getByRole('link', { name: 'Descargar PDF' }).getAttribute('href');
  expect(href).toMatch(/^\/api\/cotizaciones\/[A-Za-z0-9_-]+\/pdf$/);
  const pdf = await page.request.get(href!);
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()['content-type']).toContain('application/pdf');
  expect((await pdf.body()).subarray(0, 5).toString()).toBe('%PDF-');

  // 9. /editar como Administrador → «Cotizaciones» con el mismo total
  await page.goto('/editar');
  await page.getByRole('button', { name: 'Administrador' }).click();
  await page.getByRole('tab', { name: /Cotizaciones/ }).click();
  const registro = page.getByRole('listitem').filter({ hasText: nombre });
  await expect(registro).toBeVisible();
  await expect(registro.getByText(/Total .*255\.850/)).toBeVisible();
  await expect(registro.getByText('comprador@ejemplo.test · 3000000004')).toBeVisible();
  await capturar(page, info, 'catalogo', '08-editor-cotizaciones');
});
