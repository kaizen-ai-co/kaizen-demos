'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

/** Cambia el estado de una cita (PATCH /api/citas/[id]). Cancelar libera el hueco. */
export function EstadoCita({ id, estado }: { id: string; estado: string }) {
  const router = useRouter();
  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState(false);
  return (
    <label className="mt-1 block">
      <span className="sr-only">Estado de la cita</span>
      <select
        className="w-full rounded border border-borde bg-fondo px-1 py-0.5"
        defaultValue={estado}
        disabled={guardando}
        aria-invalid={error || undefined}
        onChange={async (e) => {
          setGuardando(true);
          setError(false);
          const r = await fetch(`/api/citas/${id}`, {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ estado: e.target.value }),
          });
          setGuardando(false);
          if (!r.ok) setError(true);
          router.refresh();
        }}
      >
        <option value="pendiente">Pendiente</option>
        <option value="confirmada">Confirmada</option>
        <option value="cancelada">Cancelada</option>
      </select>
      {error && (
        <span role="alert" className="text-peligro">
          No se pudo cambiar.
        </span>
      )}
    </label>
  );
}
