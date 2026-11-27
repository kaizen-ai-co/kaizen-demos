'use client';

import { Boton } from '@kaizen/ui';
import { useRouter } from 'next/navigation';
import * as React from 'react';

/** Carga los leads de ejemplo definidos en /editar → «Datos de ejemplo» (pasan por la regla de asignación). */
export function CargarEjemplos() {
  const router = useRouter();
  const [estado, setEstado] = React.useState<string | null>(null);
  return (
    <div className="flex items-center gap-2">
      {estado && (
        <span role="status" className="text-xs text-suave">
          {estado}
        </span>
      )}
      <Boton
        variante="borde"
        tamano="sm"
        onClick={async () => {
          setEstado('Cargando…');
          const r = await fetch('/api/ejemplos', { method: 'POST' });
          const c = await r.json().catch(() => ({}));
          setEstado(r.ok ? `${c.creados} lead(s) de ejemplo creados` : (c.error ?? 'No se pudo cargar'));
          router.refresh();
        }}
      >
        Cargar datos de ejemplo
      </Boton>
    </div>
  );
}
