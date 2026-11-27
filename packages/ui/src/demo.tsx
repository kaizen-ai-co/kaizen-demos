'use client';

import * as React from 'react';
import { cn } from './utilidades';

/** Aviso fijo "Demo con datos ficticios" (obligatorio en editor y páginas públicas). */
export function AvisoDemo({ className }: { className?: string }) {
  return (
    <div
      role="note"
      className={cn('w-full bg-aviso/15 px-4 py-1.5 text-center text-xs font-medium text-texto', className)}
    >
      Demo con datos ficticios. No ingreses datos personales reales.
    </div>
  );
}

export type EstadoDeFuncion = 'disponible' | 'prototipo' | 'pendiente';

const ESTADOS: Record<EstadoDeFuncion, { texto: string; clase: string; ayuda: string }> = {
  disponible: {
    texto: 'Disponible',
    clase: 'bg-exito/15 text-exito',
    ayuda: 'Funciona de punta a punta en esta demo.',
  },
  prototipo: {
    texto: 'Prototipo',
    clase: 'bg-aviso/15 text-aviso',
    ayuda: 'Se ve y se usa, pero con datos o lógica simulados.',
  },
  pendiente: {
    texto: 'Desarrollo pendiente',
    clase: 'bg-superficie text-suave border border-borde',
    ayuda: 'Se construye si el cliente lo contrata.',
  },
};

/** Estado honesto de cada función (regla de calidad "Estado honesto"). */
export function EstadoFuncion({ estado, className }: { estado: EstadoDeFuncion; className?: string }) {
  const e = ESTADOS[estado];
  return (
    <span
      title={e.ayuda}
      className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold', e.clase, className)}
    >
      {e.texto}
    </span>
  );
}

/** Lista de funciones con su estado, para el pie de cada demo. */
export function TablaEstados({ funciones }: { funciones: { nombre: string; estado: EstadoDeFuncion }[] }) {
  if (!funciones.length) return null;
  return (
    <details className="k-contenedor py-6 text-sm">
      <summary className="cursor-pointer font-semibold leading-6">Qué incluye esta demo</summary>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {funciones.map((f) => (
          <li
            key={f.nombre}
            className="flex items-center justify-between gap-3 rounded-md border border-borde px-3 py-2"
          >
            <span>{f.nombre}</span>
            <EstadoFuncion estado={f.estado} />
          </li>
        ))}
      </ul>
    </details>
  );
}

/** Revela su contenido al entrar en pantalla; respeta "reducir movimiento" vía CSS. */
export function Aparecer({
  children,
  className,
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}) {
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return setVisible(true);
    const obs = new IntersectionObserver(([e]) => e?.isIntersecting && (setVisible(true), obs.disconnect()), {
      rootMargin: '0px 0px -10% 0px',
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <Tag ref={ref} data-visible={visible} className={cn('k-aparecer', className)}>
      {children}
    </Tag>
  );
}
