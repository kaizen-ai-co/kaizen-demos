import { expect, test, type Page } from '@playwright/test';
import { capturar, revisarAccesibilidad } from './ayudas';

test.skip(process.env.APP !== undefined && process.env.APP !== 'agenda', 'Solo para APP=agenda');

/**
 * Recorrido principal de la plantilla 6 (docs/plantillas/06-agenda.md, «Cómo probar»):
 * servicio → profesional → primer día con horarios → hora → datos ficticios → confirmación →
 * sin doble reserva (409 + alternativas en la UI) → la cita aparece en /calendario.
 * `movil` y `escritorio` comparten el servidor en memoria: cada proyecto reserva con un profesional
 * distinto para no chocar. Son 2 POST a /api/citas por proyecto (límite: 5 por hora por IP).
 */
const SERVICIO = 'Valoración inicial';
const POR_PROYECTO: Record<string, { profesional: string; id: string; telefono: string; rival: string }> = {
  movil: { profesional: 'Laura Ficticia', id: 'p-laura', telefono: '3000000001', rival: '3000000003' },
  escritorio: { profesional: 'Mateo Ejemplo', id: 'p-mateo', telefono: '3000000002', rival: '3000000004' },
};
const HORA = /^\d{1,2}:\d{2}/;

/** Lleva la página hasta el paso 3 (hora) con el servicio y el profesional elegidos. */
async function irAHoras(page: Page, profesional: string) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '¿Qué servicio necesitas?' })).toBeVisible();
  await page.getByRole('button', { name: new RegExp(SERVICIO) }).click();
  await expect(page.getByRole('heading', { name: '¿Con quién?' })).toBeVisible();
  await page.getByRole('button', { name: new RegExp(profesional) }).click();
  await expect(page.getByRole('heading', { name: '¿Qué día y a qué hora?' })).toBeVisible();
}

/** Espera a que terminen de cargar los horarios del día elegido. */
async function esperarHorarios(page: Page) {
  await expect(
    page.getByRole('button', { name: HORA }).or(page.getByText('No hay horarios disponibles este día.')).first(),
  ).toBeVisible();
}

test('reserva sin doble reserva y cita en el calendario', async ({ page, browser }, info) => {
  const datos = POR_PROYECTO[info.project.name]!;
  const nombre = `Paciente Ficticio ${info.project.name} ${Date.now()}`;

  // Paso 1: servicio.
  await page.goto('/');
  await expect(page.getByText('Demo con datos ficticios').first()).toBeVisible();
  await revisarAccesibilidad(page, info, 'paso-servicio');
  await capturar(page, info, 'agenda', '1-servicio');

  // Paso 2: profesional.
  await page.getByRole('button', { name: new RegExp(SERVICIO) }).click();
  await expect(page.getByRole('heading', { name: '¿Con quién?' })).toBeVisible();
  await revisarAccesibilidad(page, info, 'paso-profesional');
  await capturar(page, info, 'agenda', '2-profesional');

  // Paso 3: primer día con horarios (no depende del día en que se corre la prueba).
  await page.getByRole('button', { name: new RegExp(datos.profesional) }).click();
  await expect(page.getByRole('heading', { name: '¿Qué día y a qué hora?' })).toBeVisible();
  const dias = page.getByRole('group', { name: 'Día' }).getByRole('button');
  const totalDias = await dias.count();
  let dia = -1;
  for (let i = 0; i < totalDias; i++) {
    const boton = dias.nth(i);
    if (i > 0) await boton.click();
    await expect(boton).toHaveAttribute('aria-pressed', 'true');
    await esperarHorarios(page);
    if ((await page.getByRole('button', { name: HORA }).count()) > 0) {
      dia = i;
      break;
    }
  }
  expect(dia, 'ningún día de la ventana tiene horarios').toBeGreaterThanOrEqual(0);
  await revisarAccesibilidad(page, info, 'paso-hora');
  await capturar(page, info, 'agenda', '3-hora');

  const primerHueco = page.getByRole('button', { name: HORA }).first();
  const hora = ((await primerHueco.textContent()) ?? '').trim();
  await primerHueco.click();

  // Paso 4: datos ficticios.
  await expect(page.getByRole('heading', { name: 'Tus datos' })).toBeVisible();
  await revisarAccesibilidad(page, info, 'paso-datos');

  // Otro visitante (otro contexto) llega al mismo hueco antes de que se confirme.
  const rivalCtx = await browser.newContext({
    baseURL: info.project.use.baseURL,
    viewport: page.viewportSize(),
  });
  const rival = await rivalCtx.newPage();
  await irAHoras(rival, datos.profesional);
  await rival.getByRole('group', { name: 'Día' }).getByRole('button').nth(dia).click();
  await rival.getByRole('button', { name: hora, exact: true }).click();
  await expect(rival.getByRole('heading', { name: 'Tus datos' })).toBeVisible();

  await page.getByLabel('Nombre').fill(nombre);
  await page.getByLabel('Teléfono o WhatsApp').fill(datos.telefono);
  await page.getByLabel('Correo (opcional)').fill(`paciente.${info.project.name}@ejemplo.test`);
  await capturar(page, info, 'agenda', '4-datos');
  const respuesta = page.waitForResponse((r) => r.url().endsWith('/api/citas') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Confirmar reserva' }).click();
  const creada = await respuesta;
  expect(creada.status()).toBe(201);
  const { inicio } = (await creada.json()) as { inicio: string };

  // Confirmación.
  const confirmacion = page.getByRole('status').filter({ hasText: '¡Tu cita quedó reservada!' });
  await expect(confirmacion).toBeVisible();
  await expect(confirmacion).toContainText(SERVICIO);
  await expect(confirmacion).toContainText(datos.profesional);
  await expect(confirmacion).toContainText(nombre);
  await revisarAccesibilidad(page, info, 'confirmacion');
  await capturar(page, info, 'agenda', '5-confirmacion');

  // Sin doble reserva: el rival confirma el mismo hueco → 409 y la UI ofrece alternativas.
  await rival.getByLabel('Nombre').fill(`Rival Ficticio ${info.project.name}`);
  await rival.getByLabel('Teléfono o WhatsApp').fill(datos.rival);
  const rechazo = rival.waitForResponse((r) => r.url().endsWith('/api/citas') && r.request().method() === 'POST');
  await rival.getByRole('button', { name: 'Confirmar reserva' }).click();
  const r409 = await rechazo;
  expect(r409.status()).toBe(409);
  const cuerpo = (await r409.json()) as { motivo: string; alternativas: { inicio: string }[] };
  expect(cuerpo.motivo).toBe('ocupado');
  expect(cuerpo.alternativas.map((a) => a.inicio)).not.toContain(inicio);
  await expect(rival.getByText('Ese horario se acaba de ocupar. Elige uno de estos otros:')).toBeVisible();
  await expect(rival.getByRole('heading', { name: '¿Qué día y a qué hora?' })).toBeVisible();
  await expect(rival.getByRole('button', { name: HORA }).first()).toBeVisible();
  await expect(rival.getByRole('button', { name: hora, exact: true })).toHaveCount(0);
  await revisarAccesibilidad(rival, info, 'alternativas');
  await capturar(rival, info, 'agenda', '6-alternativas');
  await rivalCtx.close();

  // La cita aparece en /calendario para el equipo (Administrador tiene «citas:gestionar»).
  const fecha = new Date(Date.parse(inicio) - 5 * 3_600_000).toISOString().slice(0, 10); // America/Bogota (UTC−5)
  await page.goto('/editar');
  await page.getByRole('button', { name: 'Administrador' }).click();
  await expect(page.getByRole('tab', { name: 'Contenido' })).toBeVisible();
  await page.goto(`/calendario?semana=${fecha}&profesional=${datos.id}`);
  await expect(page.getByRole('heading', { level: 1, name: /Semana del/ })).toBeVisible();
  const cita = page.getByRole('listitem').filter({ hasText: nombre });
  await expect(cita).toBeVisible();
  await expect(cita).toContainText(SERVICIO);
  await expect(cita).toContainText('pendiente');
  await revisarAccesibilidad(page, info, 'calendario');
  await capturar(page, info, 'agenda', '7-calendario', true);
});
