'use client';

import { AreaTexto, Aviso, Boton, Etiqueta, Selector, Tarjeta } from '@kaizen/ui';
import { useRouter } from 'next/navigation';
import * as React from 'react';

type Op = { id: string; nombre: string };

/** Cambiar etapa, responsable o agregar nota (PATCH /api/leads/[id]; cada cambio queda en el historial). */
export function AccionesLead({
  id,
  etapa,
  responsableId,
  etapas,
  responsables,
}: {
  id: string;
  etapa: string;
  responsableId: string;
  etapas: Op[];
  responsables: Op[];
}) {
  const router = useRouter();
  const [mensaje, setMensaje] = React.useState<{ tono: 'exito' | 'peligro'; texto: string } | null>(null);
  const [enviando, setEnviando] = React.useState(false);

  async function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const cuerpo: Record<string, string> = {};
    if (fd.get('etapa') !== etapa) cuerpo.etapa = String(fd.get('etapa'));
    if (fd.get('responsableId') !== responsableId) cuerpo.responsableId = String(fd.get('responsableId'));
    const nota = String(fd.get('nota') ?? '').trim();
    if (nota) cuerpo.nota = nota;
    if (!Object.keys(cuerpo).length) return setMensaje({ tono: 'peligro', texto: 'No hay cambios para guardar.' });
    setEnviando(true);
    const r = await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(cuerpo),
    });
    setEnviando(false);
    if (!r.ok)
      return setMensaje({ tono: 'peligro', texto: (await r.json().catch(() => ({}))).error ?? 'No se pudo guardar.' });
    (e.target as HTMLFormElement).reset();
    setMensaje({ tono: 'exito', texto: 'Cambios guardados en el historial.' });
    router.refresh();
  }

  return (
    <Tarjeta className="h-fit">
      <h2 className="mb-3 text-lg">Seguimiento</h2>
      <form onSubmit={guardar} className="grid gap-4">
        <div className="grid gap-1.5">
          <Etiqueta htmlFor="etapa">Etapa</Etiqueta>
          <Selector id="etapa" name="etapa" defaultValue={etapa} key={etapa}>
            {etapas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </Selector>
        </div>
        <div className="grid gap-1.5">
          <Etiqueta htmlFor="responsableId">Responsable</Etiqueta>
          <Selector id="responsableId" name="responsableId" defaultValue={responsableId} key={responsableId}>
            <option value="">Sin asignar</option>
            {responsables.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </Selector>
        </div>
        <div className="grid gap-1.5">
          <Etiqueta htmlFor="nota">Nota</Etiqueta>
          <AreaTexto id="nota" name="nota" rows={3} maxLength={2000} placeholder="Ej.: Llamar el lunes en la mañana" />
        </div>
        {mensaje && <Aviso tono={mensaje.tono}>{mensaje.texto}</Aviso>}
        <Boton type="submit" disabled={enviando}>
          {enviando ? 'Guardando…' : 'Guardar'}
        </Boton>
      </form>
    </Tarjeta>
  );
}
