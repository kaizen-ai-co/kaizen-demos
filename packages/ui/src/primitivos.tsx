import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from './utilidades';

/*
 * Primitivos con la convención de shadcn/ui, en español y con tokens del tema.
 * Para sumar más componentes de shadcn: `npx shadcn@latest add <componente>`
 * dentro de packages/ui (components.json ya apunta aquí) y cambia los colores
 * por los tokens (bg-primario, text-texto, border-borde…).
 */

export const variantesBoton = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variante: {
        primario: 'bg-primario text-primario-texto hover:opacity-90 shadow-sm',
        secundario: 'bg-secundario text-secundario-texto hover:opacity-90',
        borde: 'border border-borde bg-fondo hover:bg-superficie',
        fantasma: 'hover:bg-superficie',
        peligro: 'bg-peligro text-white hover:opacity-90',
        enlace: 'text-primario underline-offset-4 hover:underline',
      },
      tamano: {
        sm: 'h-8 px-3',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
        icono: 'size-10',
      },
    },
    defaultVariants: { variante: 'primario', tamano: 'md' },
  },
);

export interface PropsBoton extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof variantesBoton> {}

export const Boton = React.forwardRef<HTMLButtonElement, PropsBoton>(({ className, variante, tamano, type = 'button', ...props }, ref) => (
  <button ref={ref} type={type} className={cn(variantesBoton({ variante, tamano }), className)} {...props} />
));
Boton.displayName = 'Boton';

/** Enlace con apariencia de botón. */
export function BotonEnlace({ className, variante, tamano, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & VariantProps<typeof variantesBoton>) {
  return <a className={cn(variantesBoton({ variante, tamano }), className)} {...props} />;
}

const claseCampo =
  'flex w-full rounded-md border border-borde bg-fondo px-3 py-2 text-sm text-texto placeholder:text-suave focus-visible:outline-2 focus-visible:outline-foco disabled:opacity-50 aria-[invalid=true]:border-peligro';

export const Entrada = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(claseCampo, 'h-10', className)} {...props} />
));
Entrada.displayName = 'Entrada';

export const AreaTexto = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(claseCampo, 'min-h-24', className)} {...props} />
));
AreaTexto.displayName = 'AreaTexto';

export const Selector = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn(claseCampo, 'h-10', className)} {...props} />
));
Selector.displayName = 'Selector';

export function Etiqueta({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('text-sm font-medium text-texto', className)} {...props} />;
}

export function Tarjeta({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-lg border border-borde bg-fondo p-6 shadow-sm', className)} {...props} />;
}

const variantesInsignia = cva('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', {
  variants: {
    tono: {
      neutro: 'bg-superficie text-texto border border-borde',
      primario: 'bg-primario text-primario-texto',
      exito: 'bg-exito/15 text-exito',
      aviso: 'bg-aviso/15 text-aviso',
      peligro: 'bg-peligro/15 text-peligro',
    },
  },
  defaultVariants: { tono: 'neutro' },
});

export function Insignia({ className, tono, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof variantesInsignia>) {
  return <span className={cn(variantesInsignia({ tono }), className)} {...props} />;
}

export function Aviso({ className, tono = 'neutro', ...props }: React.HTMLAttributes<HTMLDivElement> & { tono?: 'neutro' | 'exito' | 'aviso' | 'peligro' }) {
  const tonos = {
    neutro: 'border-borde bg-superficie',
    exito: 'border-exito/40 bg-exito/10',
    aviso: 'border-aviso/40 bg-aviso/10',
    peligro: 'border-peligro/40 bg-peligro/10',
  };
  return <div role={tono === 'peligro' ? 'alert' : 'status'} className={cn('rounded-md border p-4 text-sm', tonos[tono], className)} {...props} />;
}

/** Campo con etiqueta, ayuda y error conectados por aria. */
export function CampoFormulario({
  id, etiqueta, ayuda, error, requerido, children,
}: { id: string; etiqueta: string; ayuda?: string; error?: string; requerido?: boolean; children: React.ReactElement<Record<string, unknown>> }) {
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;
  return (
    <div className="grid gap-1.5">
      <Etiqueta htmlFor={id}>
        {etiqueta} {requerido && <span aria-hidden className="text-peligro">*</span>}
      </Etiqueta>
      {React.cloneElement(children, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': [idAyuda, idError].filter(Boolean).join(' ') || undefined,
        required: requerido,
      })}
      {ayuda && <p id={idAyuda} className="text-xs text-suave">{ayuda}</p>}
      {error && <p id={idError} className="text-xs font-medium text-peligro">{error}</p>}
    </div>
  );
}
