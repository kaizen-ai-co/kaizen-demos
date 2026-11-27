import { expect, test, type Page } from '@playwright/test';
import { capturar, revisarAccesibilidad } from './ayudas';

test.skip(process.env.APP !== undefined && process.env.APP !== 'visor3d', 'Solo para APP=visor3d');

const APP = 'visor3d';

/** Espera a que el visor termine de cargar: lienzo WebGL o imagen de reserva. Devuelve cuál quedó. */
async function esperarVisor(page: Page): Promise<'webgl' | 'reserva'> {
  const lienzo = page.getByRole('img', { name: /^Modelo 3D de Silla Andes/ });
  const reserva = page.getByRole('img', { name: 'Ilustración de una silla de madera con asiento de color' });
  await expect(lienzo.or(reserva)).toBeVisible({ timeout: 20_000 });
  if (await reserva.isVisible()) {
    await expect(page.getByText('Tu dispositivo no admite 3D; te mostramos una imagen.')).toBeVisible();
    return 'reserva';
  }
  // Con WebGL: el modelo procedural terminó de cargar cuando desaparece «Cargando modelo…».
  await expect(page.getByText(/Cargando modelo…/)).toHaveCount(0, { timeout: 20_000 });
  return 'webgl';
}

/** Paso 8 de la plantilla 4: visor → configurar partes → resumen → solicitud → lead en /editar. */
test('configurar la silla y solicitarla', async ({ page }, info) => {
  const nombre = `Cliente Ficticio ${info.project.name} ${Date.now()}`;
  await page.goto('/');
  await expect(page.getByText('Demo con datos ficticios').first()).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Arma tu producto a tu gusto y míralo antes de pedirlo',
  );

  const modo = await esperarVisor(page);
  info.annotations.push({ type: 'visor', description: modo });
  await capturar(page, info, APP, '1-visor');
  await revisarAccesibilidad(page, info, 'visor-cargado');

  // Configurador: una opción distinta a la inicial en cada parte.
  const elecciones = [
    { parte: 'Asiento', inicial: 'Arcilla', opcion: 'Oliva', id: ['asiento', 'oliva'] },
    { parte: 'Respaldo', inicial: 'Roble', opcion: 'Nogal', id: ['respaldo', 'nogal'] },
    { parte: 'Patas', inicial: 'Madera', opcion: 'Acero', id: ['patas', 'acero'] },
  ];
  const resumen = page.getByText('Tu configuración:').locator('..');
  await expect(resumen).toContainText('Asiento: Arcilla · Respaldo: Roble · Patas: Madera');
  for (const e of elecciones) {
    const grupo = page.getByRole('radiogroup', { name: e.parte });
    await expect(grupo.getByRole('radio', { name: e.inicial })).toHaveAttribute('aria-checked', 'true');
    await grupo.getByRole('radio', { name: e.opcion }).click();
    await expect(grupo.getByRole('radio', { name: e.opcion })).toHaveAttribute('aria-checked', 'true');
    await expect(grupo.getByRole('radio', { name: e.inicial })).toHaveAttribute('aria-checked', 'false');
  }
  // «Tu configuración» refleja lo elegido (y la etiqueta accesible del lienzo, si hay WebGL).
  const esperado = 'Asiento: Oliva · Respaldo: Nogal · Patas: Acero';
  await expect(resumen).toContainText(esperado);
  if (modo === 'webgl') await expect(page.getByRole('img', { name: new RegExp(esperado) })).toBeVisible();
  await capturar(page, info, APP, '2-configurado');
  await revisarAccesibilidad(page, info, 'opciones-elegidas');

  // «Reiniciar vista» solo existe con WebGL: girar el modelo y volver a la cámara inicial.
  if (modo === 'webgl') {
    const lienzo = page.locator('#configurador canvas');
    await lienzo.scrollIntoViewIfNeeded();
    const inicial = await lienzo.screenshot();
    const caja = (await lienzo.boundingBox())!;
    await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2);
    await page.mouse.down();
    await page.mouse.move(caja.x + caja.width / 2 + 120, caja.y + caja.height / 2 + 10, { steps: 8 });
    await page.mouse.up();
    await expect.poll(async () => (await lienzo.screenshot()).equals(inicial)).toBe(false);
    await page.getByRole('button', { name: 'Reiniciar vista' }).click();
    // El botón flota sobre el lienzo: se retira el puntero para que su estado hover no altere la captura.
    await page.mouse.move(0, 0);
    await expect.poll(async () => (await lienzo.screenshot()).equals(inicial)).toBe(true);
    await capturar(page, info, APP, '3-vista-reiniciada');
  } else {
    await expect(page.getByRole('button', { name: 'Reiniciar vista' })).toHaveCount(0);
  }

  // Solicitud con datos ficticios.
  const tarjeta = page.locator('#solicitar');
  await tarjeta.getByLabel('Nombre').fill(nombre);
  await tarjeta.getByLabel('Correo').fill('cliente.ficticio@ejemplo.test');
  await tarjeta.getByLabel('Teléfono').fill('3000000004');
  await tarjeta.getByLabel('¿En qué te ayudamos?').fill('Quiero cotizar esta configuración (prueba ficticia).');
  await tarjeta.getByRole('button', { name: 'Solicitar esta configuración' }).click();
  await expect(
    page.getByText('¡Recibido! Guardamos tu configuración y te escribimos con la cotización.'),
  ).toBeVisible();
  await capturar(page, info, APP, '4-solicitud-enviada');

  // /editar como Administrador → «Configuraciones pedidas» muestra la configuración y el resumen.
  await page.goto('/editar');
  await page.getByRole('button', { name: 'Administrador' }).click();
  await page.getByRole('tab', { name: /Configuraciones pedidas/ }).click();
  const lead = page.getByRole('listitem').filter({ hasText: nombre });
  await expect(lead).toBeVisible();
  for (const { id } of elecciones) await expect(lead).toContainText(`"${id[0]}": "${id[1]}"`);
  await expect(lead).toContainText(`"resumen": "${esperado}"`);
  await capturar(page, info, APP, '5-configuraciones-pedidas');
});
