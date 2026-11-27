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
  const t = (datos.textosInterfaz ?? {}) as Record<string, unknown>;
  const reglas = reglasDe(datos);

  return (
    <>
      <AvisoDemo />
      {estado === 'borrador' && (
        <p className="bg-secundario py-1 text-center text-xs text-secundario-texto">Vista previa del borrador</p>
      )}
      <main className="mx-auto w-full max-w-2xl px-4 py-8">
        <header className="mb-6">
          <p className="text-sm font-semibold text-primario">{texto(e.marca, 'Marca')}</p>
          <h1 className="mt-2 text-3xl md:text-4xl">{texto(e.titulo, 'Reserva tu cita')}</h1>
          {texto(e.subtitulo) && <p className="mt-3 text-suave">{texto(e.subtitulo)}</p>}
          {texto(e.direccion) && <p className="mt-1 text-sm text-suave">{texto(e.direccion)}</p>}
        </header>
        <Reserva
          servicios={serviciosDe(datos)}
          profesionales={profesionalesDe(datos).map((p) => ({
            id: p.id,
            nombre: p.nombre,
            cargo: p.cargo,
            foto: p.foto?.url ?? null,
            servicios: p.servicios ?? [],
          }))}
          diasAdelante={Math.min(reglas.diasAdelante, 21)}
          textos={{
            textoBoton: texto(m.textoBoton, 'Confirmar reserva'),
            tituloConfirmacion: texto(m.tituloConfirmacion, '¡Cita reservada!'),
            textoConfirmacion: texto(m.textoConfirmacion),
            textoOcupado: texto(m.textoOcupado, 'Ese horario se ocupó. Elige otro:'),
            politicaCancelacion: texto((datos.reglas as Record<string, unknown>)?.politicaCancelacion),
          }}
          interfaz={{
            ariaPasos: texto(t.ariaPasos, 'Pasos de la reserva'),
            pasoServicio: texto(t.pasoServicio, 'Servicio'),
            pasoProfesional: texto(t.pasoProfesional, 'Profesional'),
            pasoHora: texto(t.pasoHora, 'Hora'),
            pasoDatos: texto(t.pasoDatos, 'Tus datos'),
            textoAtras: texto(t.textoAtras, 'Atrás'),
            tituloPasoServicio: texto(t.tituloPasoServicio, '¿Qué servicio necesitas?'),
            tituloPasoProfesional: texto(t.tituloPasoProfesional, '¿Con quién?'),
            tituloPasoHora: texto(t.tituloPasoHora, '¿Qué día y a qué hora?'),
            tituloPasoDatos: texto(t.tituloPasoDatos, 'Tus datos'),
            unidadMinutos: texto(t.unidadMinutos, 'min'),
            textoSinCosto: texto(t.textoSinCosto, 'Sin costo'),
            cualquierProfesional: texto(t.cualquierProfesional, 'Cualquier profesional'),
            detalleCualquierProfesional: texto(t.detalleCualquierProfesional, 'La primera hora disponible'),
            ariaDias: texto(t.ariaDias, 'Día'),
            textoBuscandoHorarios: texto(t.textoBuscandoHorarios, 'Buscando horarios…'),
            textoSinHorarios: texto(t.textoSinHorarios, 'No hay horarios disponibles este día. Prueba otro.'),
            errorCargarHorarios: texto(t.errorCargarHorarios, 'No pudimos cargar los horarios.'),
            conectorProfesional: texto(t.conectorProfesional, 'con'),
            etiquetaNombre: texto(t.etiquetaNombre, 'Nombre'),
            etiquetaTelefono: texto(t.etiquetaTelefono, 'Teléfono o WhatsApp'),
            etiquetaCorreo: texto(t.etiquetaCorreo, 'Correo (opcional)'),
            errorNombre: texto(t.errorNombre, 'Escribe tu nombre.'),
            errorContacto: texto(t.errorContacto, 'Deja un teléfono o un correo.'),
            errorCorreo: texto(t.errorCorreo, 'Revisa el correo.'),
            textoReservando: texto(t.textoReservando, 'Reservando…'),
            errorReservar: texto(t.errorReservar, 'No pudimos reservar.'),
            resumenServicio: texto(t.resumenServicio, 'Servicio'),
            resumenProfesional: texto(t.resumenProfesional, 'Con'),
            resumenDia: texto(t.resumenDia, 'Día'),
            resumenHora: texto(t.resumenHora, 'Hora'),
            resumenNombre: texto(t.resumenNombre, 'A nombre de'),
            textoReservarOtra: texto(t.textoReservarOtra, 'Reservar otra cita'),
          }}
        />
        <p className="mt-8 text-center text-xs text-suave">
          ¿Eres del equipo?{' '}
          <a className="underline" href="/calendario">
            Abrir el calendario
          </a>
        </p>
      </main>
      <TablaEstados funciones={plantilla.config.funciones ?? []} />
    </>
  );
}
