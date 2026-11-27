/**
 * Cálculo de huecos disponibles para la agenda (plantilla 6).
 *
 * Zona horaria fija: America/Bogota (UTC−5, sin horario de verano). Por eso las
 * conversiones se hacen con un desfase constante y el resultado no depende de la
 * zona horaria del servidor (Vercel corre en UTC, un portátil en otra).
 *
 * Entradas:
 *  - horario semanal del profesional: { lunes: [{ inicio: '08:00', fin: '12:00' }, …], … }
 *  - excepciones: días completos o franjas bloqueadas (festivos, ausencias)
 *  - citas existentes (las canceladas no ocupan)
 *  - duración del servicio y reglas (intervalo entre inicios, colchón, anticipación mínima, días hacia adelante)
 */

export const ZONA = 'America/Bogota';
const DESFASE_MIN = -5 * 60; // Bogotá = UTC−5 todo el año
const MS_MIN = 60_000;

export const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const;
export type Dia = (typeof DIAS)[number];

export interface Franja {
  inicio: string; // "HH:MM"
  fin: string; // "HH:MM"
}

export type HorarioSemanal = Partial<Record<Dia, Franja[]>>;

export interface Excepcion {
  fecha: string; // "YYYY-MM-DD" en hora de Bogotá
  /** Si no hay franjas, el día completo queda bloqueado. */
  franjas?: Franja[];
  motivo?: string;
  /** Si se indica, solo aplica a ese profesional; si no, a todos (festivo). */
  profesionalId?: string;
}

export interface CitaOcupada {
  profesionalId: string;
  inicio: string; // ISO
  fin: string; // ISO
  estado?: 'pendiente' | 'confirmada' | 'cancelada';
}

export interface ReglasHuecos {
  /** Cada cuántos minutos puede empezar una cita (15, 30…). */
  intervaloMin: number;
  /** Minutos libres obligatorios entre citas. */
  colchonMin: number;
  /** No se ofrecen huecos que empiecen antes de ahora + anticipación. */
  anticipacionMin: number;
  /** Hasta cuántos días hacia adelante se puede reservar. */
  diasAdelante: number;
}

export const REGLAS_POR_DEFECTO: ReglasHuecos = {
  intervaloMin: 30,
  colchonMin: 0,
  anticipacionMin: 120,
  diasAdelante: 30,
};

export interface Hueco {
  profesionalId: string;
  inicio: string; // ISO con -05:00
  fin: string;
}

const aMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

/** "2026-12-01" + minutos desde medianoche (hora Bogotá) → epoch ms. */
export function instanteBogota(fecha: string, minutos: number): number {
  const [a, m, d] = fecha.split('-').map(Number);
  return Date.UTC(a!, m! - 1, d!, 0, 0) + (minutos - DESFASE_MIN) * MS_MIN;
}

/** epoch ms → "2026-12-01T09:30:00-05:00". */
export function isoBogota(ms: number): string {
  const local = new Date(ms + DESFASE_MIN * MS_MIN);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${local.getUTCFullYear()}-${p(local.getUTCMonth() + 1)}-${p(local.getUTCDate())}T${p(local.getUTCHours())}:${p(local.getUTCMinutes())}:00-05:00`;
}

/** Fecha "YYYY-MM-DD" en Bogotá de un instante. */
export function fechaBogota(ms: number): string {
  return isoBogota(ms).slice(0, 10);
}

export function diaDeSemana(fecha: string): Dia {
  const [a, m, d] = fecha.split('-').map(Number);
  return DIAS[new Date(Date.UTC(a!, m! - 1, d!)).getUTCDay()]!;
}

export function sumarDias(fecha: string, n: number): string {
  const [a, m, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(a!, m! - 1, d! + n)).toISOString().slice(0, 10);
}

function restarFranjas(base: [number, number][], quitar: [number, number][]): [number, number][] {
  let resultado = base;
  for (const [qi, qf] of quitar) {
    resultado = resultado.flatMap(([i, f]) => {
      if (qf <= i || qi >= f) return [[i, f] as [number, number]];
      const partes: [number, number][] = [];
      if (qi > i) partes.push([i, qi]);
      if (qf < f) partes.push([qf, f]);
      return partes;
    });
  }
  return resultado;
}

export interface EntradaHuecos {
  fecha: string; // día a consultar (Bogotá)
  profesionalId: string;
  duracionMin: number;
  horario: HorarioSemanal;
  excepciones?: Excepcion[];
  citas?: CitaOcupada[];
  reglas?: Partial<ReglasHuecos>;
  /** Para pruebas: instante "ahora". */
  ahora?: Date;
}

/** Huecos libres de UN profesional en UN día. */
export function calcularHuecos(e: EntradaHuecos): Hueco[] {
  const reglas = { ...REGLAS_POR_DEFECTO, ...(e.reglas ?? {}) };
  const ahora = (e.ahora ?? new Date()).getTime();
  const hoy = fechaBogota(ahora);
  if (e.fecha < hoy || e.fecha > sumarDias(hoy, reglas.diasAdelante)) return [];

  const excepciones = (e.excepciones ?? []).filter(
    (x) => x.fecha === e.fecha && (!x.profesionalId || x.profesionalId === e.profesionalId),
  );
  if (excepciones.some((x) => !x.franjas?.length)) return []; // día bloqueado completo

  const franjas = (e.horario[diaDeSemana(e.fecha)] ?? []).map(
    (f) => [instanteBogota(e.fecha, aMin(f.inicio)), instanteBogota(e.fecha, aMin(f.fin))] as [number, number],
  );
  const bloqueadas = excepciones.flatMap((x) =>
    x.franjas!.map(
      (f) => [instanteBogota(e.fecha, aMin(f.inicio)), instanteBogota(e.fecha, aMin(f.fin))] as [number, number],
    ),
  );
  const colchon = reglas.colchonMin * MS_MIN;
  const ocupadas = (e.citas ?? [])
    .filter((c) => c.profesionalId === e.profesionalId && c.estado !== 'cancelada')
    .map((c) => [Date.parse(c.inicio) - colchon, Date.parse(c.fin) + colchon] as [number, number]);

  const libres = restarFranjas(restarFranjas(franjas, bloqueadas), ocupadas);
  const duracion = e.duracionMin * MS_MIN;
  const paso = reglas.intervaloMin * MS_MIN;
  const minimo = ahora + reglas.anticipacionMin * MS_MIN;
  const inicioDia = instanteBogota(e.fecha, 0);

  const huecos: Hueco[] = [];
  for (const [i, f] of libres) {
    // Los inicios se alinean a la grilla del día (8:00, 8:30…), no al borde de la franja libre.
    let t = inicioDia + Math.ceil((i - inicioDia) / paso) * paso;
    for (; t + duracion <= f; t += paso) {
      if (t >= minimo)
        huecos.push({ profesionalId: e.profesionalId, inicio: isoBogota(t), fin: isoBogota(t + duracion) });
    }
  }
  return huecos;
}

/** Huecos de varios profesionales en un día (para "cualquier profesional"). */
export function calcularHuecosVarios(
  base: Omit<EntradaHuecos, 'profesionalId' | 'horario'>,
  profesionales: { id: string; horario: HorarioSemanal }[],
): Hueco[] {
  return profesionales
    .flatMap((p) => calcularHuecos({ ...base, profesionalId: p.id, horario: p.horario }))
    .sort((a, b) => a.inicio.localeCompare(b.inicio));
}

/** Días con al menos un hueco, para pintar el calendario del paso "hora". */
export function diasConHuecos(base: Omit<EntradaHuecos, 'fecha'>, desde: string, cantidad: number): string[] {
  const dias: string[] = [];
  for (let i = 0; i < cantidad; i++) {
    const fecha = sumarDias(desde, i);
    if (calcularHuecos({ ...base, fecha }).length) dias.push(fecha);
  }
  return dias;
}
