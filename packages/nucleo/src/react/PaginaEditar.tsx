import 'server-only';
import { MENSAJES_SIN_ACCESO, rolDeEdicion, type Usuario } from '@kaizen/datos';
import { completarContenido, filtrarPorRol, type Contenido } from '@kaizen/editor';
import { Editor, type PropsEditor, type VistaExtra } from '@kaizen/editor/react';
import type { ComponentType } from 'react';
import type { Plantilla } from '../servidor/plantilla';
import { modoInicioSesion } from '../servidor/sesion';
import { InicioSesion, SinAcceso } from './InicioSesion';

/**
 * Página /editar completa. En la app:
 *
 *   export default function Page() {
 *     return <PaginaEditar plantilla={plantilla} vistas={async (u) => [...]} />;
 *   }
 *
 * - `vistas`: pestañas extra de solo lectura (Leads, Cotizaciones, Citas…).
 * - `editor`: un componente cliente que envuelve <Editor> y registra controles propios
 *   (p. ej. el visor 3D con "Guardar vista"). Por defecto se usa <Editor>.
 */
export async function PaginaEditar({
  plantilla,
  vistas,
  editor: ComponenteEditor = Editor,
}: {
  plantilla: Plantilla;
  vistas?: (usuario: Usuario) => Promise<VistaExtra[]> | VistaExtra[];
  editor?: ComponentType<PropsEditor>;
}) {
  const acceso = await plantilla.accesoActual();
  const titulo = `Editar · ${plantilla.config.esquema.titulo}`;

  if (!acceso.ok) {
    if (acceso.motivo === 'sin-sesion') return <InicioSesion modo={modoInicioSesion()} titulo={titulo} />;
    return <SinAcceso mensaje={MENSAJES_SIN_ACCESO[acceso.motivo]} correo={acceso.usuario?.correo} />;
  }

  const { usuario } = acceso;
  const c = await plantilla.capa();
  const id = plantilla.sitioId();
  await plantilla.asegurarSemilla(c, id);
  const borrador = await c.contenido.leerBorrador(id);
  const publicado = await c.contenido.leerPublicado(id);
  const inicial = completarContenido(
    plantilla.config.esquema,
    ((borrador ?? publicado)?.datos as Contenido) ?? plantilla.config.semilla,
  );
  const esquemaRol = filtrarPorRol(plantilla.config.esquema, rolDeEdicion(usuario.rol));

  return (
    <ComponenteEditor
      esquema={esquemaRol}
      esquemaCompleto={plantilla.config.esquema}
      inicial={inicial}
      sitioId={id}
      usuario={{ correo: usuario.correo, nombre: usuario.nombre, rol: usuario.rol, venceEl: usuario.venceEl }}
      ultimaPublicacion={publicado ? { por: publicado.publicadoPor, el: publicado.publicadoEl } : null}
      vistasExtra={vistas ? await vistas(usuario) : []}
    />
  );
}
