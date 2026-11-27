'use client';

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Aviso, cn } from '@kaizen/ui';
import { GripVertical } from 'lucide-react';
import * as React from 'react';

interface LeadTarjeta {
  id: string;
  nombre: string;
  etapa: string;
  responsableId?: string;
  origen: string;
}
interface Etapa {
  id: string;
  nombre: string;
  color?: string;
}

const TONOS: Record<string, string> = {
  primario: 'bg-primario',
  acento: 'bg-acento',
  exito: 'bg-exito',
  aviso: 'bg-aviso',
  peligro: 'bg-peligro',
  neutro: 'bg-suave',
};

function Tarjeta({
  lead,
  responsable,
  etapas,
  alMover,
}: {
  lead: LeadTarjeta;
  responsable: string;
  etapas: Etapa[];
  alMover: (id: string, etapa: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        // min-w-0: como hijo de grid, la tarjeta no crece con un nombre largo (el texto se recorta).
        'min-w-0 rounded-md border border-borde bg-fondo p-3 text-sm shadow-sm',
        isDragging && 'z-20 opacity-80 shadow-lg',
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 cursor-grab touch-none rounded p-0.5 text-suave hover:bg-superficie"
          aria-label={`Arrastrar ${lead.nombre}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <a href={`/panel/leads/${lead.id}`} className="block truncate font-semibold hover:underline">
            {lead.nombre}
          </a>
          <p className="truncate text-xs text-suave">
            {responsable} · {lead.origen}
          </p>
          <label className="mt-2 block text-xs">
            <span className="sr-only">Mover {lead.nombre} a</span>
            <select
              className="w-full rounded border border-borde bg-fondo px-1 py-0.5 text-xs"
              value={lead.etapa}
              onChange={(e) => alMover(lead.id, e.target.value)}
            >
              {etapas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </li>
  );
}

function Columna({ etapa, children, cantidad }: { etapa: Etapa; children: React.ReactNode; cantidad: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa.id });
  return (
    <section
      ref={setNodeRef}
      aria-label={`Etapa ${etapa.nombre}`}
      className={cn(
        'flex w-72 shrink-0 flex-col rounded-lg border border-borde bg-superficie p-3',
        isOver && 'ring-2 ring-primario',
      )}
    >
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <span aria-hidden className={cn('size-2.5 rounded-full', TONOS[etapa.color ?? 'neutro'] ?? 'bg-suave')} />
        {etapa.nombre}
        <span className="ml-auto text-xs font-normal text-suave">{cantidad}</span>
      </h2>
      <ul className="grid min-h-24 gap-2">{children}</ul>
    </section>
  );
}

export function Tablero({
  etapas,
  responsables,
  leadsIniciales,
}: {
  etapas: Etapa[];
  responsables: Record<string, string>;
  leadsIniciales: LeadTarjeta[];
}) {
  const [leads, setLeads] = React.useState(leadsIniciales);
  const [error, setError] = React.useState<string | null>(null);
  const [anuncio, setAnuncio] = React.useState('');
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor),
  );

  async function mover(id: string, etapa: string) {
    const previo = leads.find((l) => l.id === id);
    if (!previo || previo.etapa === etapa) return;
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, etapa } : l))); // optimista
    setError(null);
    const r = await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ etapa }),
    });
    if (!r.ok) {
      setLeads((ls) => ls.map((l) => (l.id === id ? previo : l)));
      setError((await r.json().catch(() => ({}))).error ?? 'No se pudo mover el lead.');
      return;
    }
    setAnuncio(`${previo.nombre} movido a ${etapas.find((e) => e.id === etapa)?.nombre ?? etapa}`);
  }

  function alSoltar(e: DragEndEvent) {
    if (e.over) void mover(String(e.active.id), String(e.over.id));
  }

  const sinEtapa = leads.filter((l) => !etapas.some((e) => e.id === l.etapa));

  return (
    <div className="grid gap-3">
      {error && <Aviso tono="peligro">{error}</Aviso>}
      <p className="sr-only" aria-live="polite">
        {anuncio}
      </p>
      <DndContext sensors={sensores} onDragEnd={alSoltar}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {etapas.map((etapa) => {
            const deEtapa = leads.filter((l) => l.etapa === etapa.id);
            return (
              <Columna key={etapa.id} etapa={etapa} cantidad={deEtapa.length}>
                {deEtapa.map((l) => (
                  <Tarjeta
                    key={l.id}
                    lead={l}
                    etapas={etapas}
                    responsable={l.responsableId ? (responsables[l.responsableId] ?? l.responsableId) : 'Sin asignar'}
                    alMover={mover}
                  />
                ))}
              </Columna>
            );
          })}
        </div>
      </DndContext>
      {sinEtapa.length > 0 && (
        <Aviso tono="aviso">
          {sinEtapa.length} lead(s) tienen una etapa que ya no existe. Muévelos desde su detalle.
        </Aviso>
      )}
    </div>
  );
}
