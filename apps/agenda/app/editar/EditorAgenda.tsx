'use client';

import { Editor, Envoltorio, registrarControl, type PropsControl, type PropsEditor } from '@kaizen/editor/react';
import { Boton, Entrada, cn } from '@kaizen/ui';
import { Plus, Trash2 } from 'lucide-react';

/**
 * Editor de la agenda: el mismo <Editor> de la base + el control propio «horarioSemanal».
 * Valor: { lunes: [{ inicio: '08:00', fin: '12:00' }], martes: [...], ... } (HorarioSemanal de @kaizen/modulos/huecos).
 */

type Franja = { inicio: string; fin: string };
type Horario = Partial<Record<string, Franja[]>>;

const DIAS: { id: string; nombre: string }[] = [
  { id: 'lunes', nombre: 'Lunes' },
  { id: 'martes', nombre: 'Martes' },
  { id: 'miercoles', nombre: 'Miércoles' },
  { id: 'jueves', nombre: 'Jueves' },
  { id: 'viernes', nombre: 'Viernes' },
  { id: 'sabado', nombre: 'Sábado' },
  { id: 'domingo', nombre: 'Domingo' },
];

function franjaInvalida(f: Franja) {
  return !f.inicio || !f.fin || f.inicio >= f.fin;
}

function ControlHorario({ campo, valor, alCambiar, ruta, errores }: PropsControl<Horario>) {
  const horario: Horario = valor && typeof valor === 'object' ? valor : {};
  const fijar = (dia: string, franjas: Franja[] | undefined) => {
    const siguiente = { ...horario };
    if (franjas && franjas.length) siguiente[dia] = franjas;
    else delete siguiente[dia];
    alCambiar(siguiente);
  };

  return (
    <Envoltorio campo={campo} ruta={ruta} errores={errores}>
      <div className="grid gap-2 rounded-md border border-borde p-3">
        {DIAS.map((d) => {
          const franjas = horario[d.id] ?? [];
          const atiende = franjas.length > 0;
          return (
            <div key={d.id} className="grid gap-2 border-b border-borde pb-2 last:border-0 last:pb-0">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  className="size-4"
                  checked={atiende}
                  onChange={(e) => fijar(d.id, e.target.checked ? [{ inicio: '08:00', fin: '12:00' }] : undefined)}
                />
                {d.nombre}
                {!atiende && <span className="text-xs font-normal text-suave">No atiende</span>}
              </label>
              {franjas.map((f, i) => (
                <div key={i} className="flex items-center gap-2 pl-6">
                  <Entrada
                    type="time"
                    aria-label={`${d.nombre} franja ${i + 1} desde`}
                    value={f.inicio}
                    className={cn('h-8 w-28', franjaInvalida(f) && 'border-peligro')}
                    onChange={(e) =>
                      fijar(
                        d.id,
                        franjas.map((x, j) => (j === i ? { ...x, inicio: e.target.value } : x)),
                      )
                    }
                  />
                  <span className="text-xs text-suave">a</span>
                  <Entrada
                    type="time"
                    aria-label={`${d.nombre} franja ${i + 1} hasta`}
                    value={f.fin}
                    className={cn('h-8 w-28', franjaInvalida(f) && 'border-peligro')}
                    onChange={(e) =>
                      fijar(
                        d.id,
                        franjas.map((x, j) => (j === i ? { ...x, fin: e.target.value } : x)),
                      )
                    }
                  />
                  <Boton
                    variante="fantasma"
                    tamano="icono"
                    className="size-8"
                    aria-label={`Quitar franja ${i + 1} del ${d.nombre}`}
                    onClick={() =>
                      fijar(
                        d.id,
                        franjas.filter((_, j) => j !== i),
                      )
                    }
                  >
                    <Trash2 />
                  </Boton>
                </div>
              ))}
              {franjas.some(franjaInvalida) && (
                <p role="alert" className="pl-6 text-xs text-peligro">
                  La hora de inicio debe ser menor que la de fin.
                </p>
              )}
              {atiende && franjas.length < 4 && (
                <Boton
                  variante="enlace"
                  tamano="sm"
                  className="h-6 justify-start pl-6"
                  onClick={() => fijar(d.id, [...franjas, { inicio: franjas.at(-1)?.fin ?? '14:00', fin: '18:00' }])}
                >
                  <Plus aria-hidden /> Agregar franja
                </Boton>
              )}
            </div>
          );
        })}
      </div>
    </Envoltorio>
  );
}

registrarControl('horarioSemanal', ControlHorario);

export default function EditorAgenda(props: PropsEditor) {
  return <Editor {...props} />;
}
