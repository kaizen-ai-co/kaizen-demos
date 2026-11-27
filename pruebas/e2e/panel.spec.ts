import { expect, test } from '@playwright/test';
import { capturar, revisarAccesibilidad } from './ayudas';

test.skip(process.env.APP !== undefined && process.env.APP !== 'panel', 'Solo para APP=panel');

/** Responsables activos de la semilla (Camila Demo está inactiva y nunca debe recibir leads). */
const ACTIVOS = ['Ana Ficticia', 'Bruno Ejemplo'];

/**
 * Recorrido principal de la plantilla 5 (docs/plantillas/05-panel.md, «Cómo probar»):
 * formulario móvil → lead asignado por turnos → filtros → detalle con historial → cambio de etapa → tablero.
 */
test('formulario móvil a lead asignado y movido de etapa', async ({ page }, info) => {
  const nombre = `Visitante Ficticio ${info.project.name} ${Date.now()}`;
  const correo = `visitante.${info.project.name}@ejemplo.test`;

  // 1. Formulario público con datos ficticios.
  await page.goto('/');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Cuéntanos qué necesitas y te llamamos hoy' }),
  ).toBeVisible();
  await revisarAccesibilidad(page, info, 'formulario');
  await capturar(page, info, 'panel', 'formulario', true);

  await page.getByLabel(/^Nombre/).fill(nombre);
  await page.getByLabel(/^WhatsApp/).fill('3000000007');
  await page.getByLabel(/^Correo/).fill(correo);
  await page.getByLabel(/¿Qué te interesa\?/).selectOption('Plan mensual');
  await page.getByRole('button', { name: 'Quiero que me llamen' }).click();
  await expect(
    page.getByText('¡Recibido! Un asesor te escribe por WhatsApp en menos de 2 horas hábiles.'),
  ).toBeVisible();
  await capturar(page, info, 'panel', 'formulario-enviado');

  // 2. /panel está protegido: sin sesión redirige a /editar.
  await page.goto('/panel');
  await expect(page).toHaveURL(/\/editar$/);
  await page.getByRole('button', { name: 'Administrador' }).click();
  await expect(page.getByRole('tab', { name: /Leads/ })).toBeVisible();

  await page.goto('/panel');
  await expect(page.getByRole('heading', { level: 1, name: 'Resumen' })).toBeVisible();
  await capturar(page, info, 'panel', 'resumen');

  // 3. Lista de leads: el lead aparece asignado a un responsable activo (regla de turnos).
  await page.goto('/panel/leads');
  await expect(page.getByRole('heading', { level: 1, name: 'Leads' })).toBeVisible();
  const enlaceLead = page.getByRole('link', { name: new RegExp(nombre) });
  await expect(enlaceLead).toBeVisible();
  const textoLead = (await enlaceLead.innerText()).replace(/\s+/g, ' ');
  const responsable = ACTIVOS.find((r) => textoLead.includes(r));
  expect(responsable, `responsable asignado en «${textoLead}»`).toBeDefined();
  expect(textoLead).toContain('Nuevo');
  await revisarAccesibilidad(page, info, 'leads');
  await capturar(page, info, 'panel', 'leads');

  // Filtros: búsqueda por nombre + responsable asignado → aparece; etapa «Ganado» → no aparece.
  const filtros = page.locator('form[method="get"]');
  await filtros.getByLabel('Buscar').fill(nombre);
  await filtros.getByLabel('Responsable').selectOption({ label: responsable! });
  await filtros.getByRole('button', { name: 'Filtrar' }).click();
  await expect(page).toHaveURL(/responsable=r-/);
  await expect(page.getByText('1 resultado(s)')).toBeVisible();
  await expect(enlaceLead).toBeVisible();
  await capturar(page, info, 'panel', 'leads-filtrados');

  await filtros.getByLabel('Etapa').selectOption({ label: 'Ganado' });
  await filtros.getByRole('button', { name: 'Filtrar' }).click();
  await expect(page).toHaveURL(/etapa=ganado/);
  await expect(page.getByText('No hay leads con esos filtros.')).toBeVisible();
  await expect(enlaceLead).toHaveCount(0);

  await page.getByRole('link', { name: 'Limpiar' }).click();
  await expect(page).toHaveURL(/\/panel\/leads$/);

  // 4. Detalle con historial.
  await enlaceLead.click();
  await expect(page.getByRole('heading', { level: 1, name: nombre })).toBeVisible();
  await expect(page.getByText(correo)).toBeVisible();
  const historial = page.locator('ol').filter({ hasText: 'Lead creado desde' });
  await expect(historial).toBeVisible();
  await revisarAccesibilidad(page, info, 'detalle');
  await capturar(page, info, 'panel', 'detalle', true);

  // 5. Cambiar etapa desde el selector del detalle (sin depender del arrastre).
  await page.getByLabel('Etapa', { exact: true }).selectOption({ label: 'Contactado' });
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Cambios guardados en el historial.')).toBeVisible();
  await expect(historial.getByText('Etapa: Nuevo → Contactado')).toBeVisible();
  await capturar(page, info, 'panel', 'detalle-etapa', true);

  // 6. Tablero: el lead está en la columna «Contactado»; se mueve a «Propuesta» con el selector de la tarjeta.
  await page.goto('/panel/tablero');
  await expect(page.getByRole('heading', { level: 1, name: 'Tablero por etapas' })).toBeVisible();
  const contactado = page.getByRole('region', { name: 'Etapa Contactado' });
  await expect(contactado.getByRole('link', { name: nombre })).toBeVisible();
  await revisarAccesibilidad(page, info, 'tablero');
  await capturar(page, info, 'panel', 'tablero');

  await contactado.getByLabel(`Mover ${nombre} a`).selectOption({ label: 'Propuesta' });
  const propuesta = page.getByRole('region', { name: 'Etapa Propuesta' });
  await expect(propuesta.getByRole('link', { name: nombre })).toBeVisible();
  await expect(page.getByText(`${nombre} movido a Propuesta`)).toBeAttached();

  // El cambio quedó guardado: tras recargar sigue en «Propuesta» y el historial lo registra.
  await page.reload();
  await expect(page.getByRole('region', { name: 'Etapa Propuesta' }).getByRole('link', { name: nombre })).toBeVisible();
  await capturar(page, info, 'panel', 'tablero-movido');
  await page.getByRole('region', { name: 'Etapa Propuesta' }).getByRole('link', { name: nombre }).click();
  await expect(page.getByText('Etapa: Contactado → Propuesta')).toBeVisible();
});
