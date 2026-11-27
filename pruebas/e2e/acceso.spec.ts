import { expect, test } from '@playwright/test';

/** Paso 7 de la base: se corre contra cualquier APP. */
test.describe('acceso por rol', () => {
  test('sin sesión: /editar pide entrar y la API responde 401', async ({ page, request }) => {
    await page.goto('/editar');
    await expect(page.getByText(/Elige una cuenta de prueba|Entrar con Google/)).toBeVisible();
    expect((await request.get('/api/editor/borrador')).status()).toBe(401);
  });

  test('cuenta no autorizada: «Sin acceso» y 403', async ({ page }) => {
    await page.goto('/editar');
    await page.getByRole('button', { name: 'No autorizada' }).click();
    await expect(page.getByRole('heading', { name: 'Sin acceso' })).toBeVisible();
    expect((await page.request.get('/api/editor/borrador')).status()).toBe(403);
  });

  test('administrador: sin pestaña Estructura y sin poder cambiarla por API', async ({ page }) => {
    await page.goto('/editar');
    await page.getByRole('button', { name: 'Administrador' }).click();
    await expect(page.getByRole('tab', { name: 'Contenido' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Estructura' })).toHaveCount(0);
    const { datos } = await (await page.request.get('/api/editor/borrador')).json();
    const manipulado = { ...datos, _estructura: { ...datos._estructura, ocultas: datos._estructura.orden } };
    await page.request.put('/api/editor/borrador', { data: { datos: manipulado } });
    const despues = (await (await page.request.get('/api/editor/borrador')).json()).datos;
    expect(despues._estructura.ocultas).toEqual(datos._estructura.ocultas);
  });

  test('desarrollador: ve la pestaña Estructura', async ({ page }) => {
    await page.goto('/editar');
    await page.getByRole('button', { name: 'Desarrollador' }).click();
    await expect(page.getByRole('tab', { name: 'Estructura' })).toBeVisible();
  });

  test('el borrador no se ve sin sesión', async ({ browser }) => {
    const anonimo = await browser.newContext();
    const r = await anonimo.request.get('/?vista=borrador');
    expect(await r.text()).not.toContain('Vista previa del borrador');
    await anonimo.close();
  });
});
