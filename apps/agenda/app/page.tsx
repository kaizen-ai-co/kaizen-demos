import { AvisoDemo, TablaEstados, texto } from '@kaizen/ui';
import { profesionalesDe, reglasDe, serviciosDe } from '@/lib/agenda';
import { plantilla } from '@/lib/plantilla';
import { Reserva } from './Reserva';

/** Página pública: flujo de reserva en 4 pasos con datos del contenido publicado. */
export default async function Inicio({ searchParams }: { searchParams: Promise<{ vista?: string }> }) {
  const { vista } = await searchParams;
  const { datos, estado } = await plantilla.obtenerContenido({ vista });
  const e = (datos.encabezado ?? {}) as Record<string, unknown>;
  const m = (datos.mensajes ?? {}) as Record<string, unknown>;
  const reglas = reglasDe(datos);

  return (
    <>
      <AvisoDemo />
      {estado === 'borrador' && <p className="bg-secundario py-1 text-center text-xs text-secundario-texto">Vista previa del borrador</p>}
      <main className="mx-auto w-full max-w-2xl px-4 py-8">
        <header className="mb-6">
          <p className="text-sm font-semibold text-primario">{texto(e.marca, 'Marca')}</p>
          <h1 className="mt-2 text-3xl md:text-4xl">{texto(e.titulo, 'Reserva tu cita')}</h1>
          {texto(e.subtitulo) && <p className="mt-3 text-suave">{texto(e.subtitulo)}</p>}
          {texto(e.direccion) && <p className="mt-1 text-sm text-suave">{texto(e.direccion)}</p>}
        </header>
        <Reserva
          servicios={serviciosDe(datos)}
          profesionales={profesionalesDe(datos).map((p) => ({ id: p.id, nombre: p.nombre, cargo: p.cargo, foto: p.foto?.url ?? null, servicios: p.servicios ?? [] }))}
          diasAdelante={Math.min(reglas.diasAdelante, 21)}
          textos={{
            textoBoton: texto(m.textoBoton, 'Confirmar reserva'),
            tituloConfirmacion: texto(m.tituloConfirmacion, '¡Cita reservada!'),
            textoConfirmacion: texto(m.textoConfirmacion),
            textoOcupado: texto(m.textoOcupado, 'Ese horario se ocupó. Elige otro:'),
            politicaCancelacion: texto((datos.reglas as Record<string, unknown>)?.politicaCancelacion),
          }}
        />
        <p className="mt-8 text-center text-xs text-suave">¿Eres del equipo? <a className="underline" href="/calendario">Abrir el calendario</a></p>
      </main>
      <TablaEstados funciones={plantilla.config.funciones ?? []} />
    </>
  );
}
