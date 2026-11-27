import { AvisoDemo, TablaEstados, Tarjeta, texto, lista } from '@kaizen/ui';
import { FormularioLead, type CampoLead } from '@kaizen/ui/modulos';
import { plantilla } from '@/lib/plantilla';

/** Formulario móvil público: cada envío crea un lead en la capa de datos y se asigna por regla. */
export default async function FormularioMovil({ searchParams }: { searchParams: Promise<{ vista?: string }> }) {
  const { vista } = await searchParams;
  const { datos, estado } = await plantilla.obtenerContenido({ vista });
  const f = (datos.formulario ?? {}) as Record<string, unknown>;
  const campos = lista<CampoLead & { opciones?: unknown }>(f.camposFormulario).map((c) => ({
    ...c,
    opciones: Array.isArray(c.opciones)
      ? (c.opciones as { texto?: string }[]).map((o) => (typeof o === 'string' ? o : (o?.texto ?? '')))
      : undefined,
  }));

  return (
    <>
      <AvisoDemo />
      {estado === 'borrador' && (
        <p className="bg-secundario py-1 text-center text-xs text-secundario-texto">Vista previa del borrador</p>
      )}
      <main className="mx-auto flex min-h-[80dvh] w-full max-w-md flex-col gap-6 px-4 py-8">
        <header>
          <p className="text-sm font-semibold text-primario">{texto(f.marca, 'Marca')}</p>
          <h1 className="mt-2 text-3xl">{texto(f.titulo, 'Déjanos tus datos')}</h1>
          {texto(f.subtitulo) && <p className="mt-3 text-suave">{texto(f.subtitulo)}</p>}
        </header>
        <Tarjeta className="p-5">
          <FormularioLead
            campos={campos}
            origen="formulario-movil"
            textoBoton={texto(f.textoBoton, 'Enviar')}
            mensajeExito={texto(f.mensajeExito) || undefined}
          />
        </Tarjeta>
        <p className="text-center text-xs text-suave">
          ¿Eres del equipo?{' '}
          <a className="underline" href="/panel">
            Abrir el panel
          </a>
        </p>
      </main>
      <TablaEstados funciones={plantilla.config.funciones ?? []} />
    </>
  );
}
