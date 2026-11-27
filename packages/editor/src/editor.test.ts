import { describe, expect, it } from 'vitest';
import {
  cambiosProhibidos,
  completarContenido,
  contenidoInicial,
  filtrarPorRol,
  fusionarSeguro,
  revisarEsquema,
  seccionesVisibles,
  validarContenido,
  type EsquemaContenido,
} from './index';

const esquema: EsquemaContenido = {
  plantilla: 'prueba',
  version: 1,
  titulo: 'Prueba',
  secciones: [
    {
      id: 'portada',
      titulo: 'Portada',
      variantes: ['centrada', 'dividida'],
      campos: [
        { id: 'titulo', etiqueta: 'Título', tipo: 'texto', requerido: true, max: 20 },
        { id: 'imagen', etiqueta: 'Imagen', tipo: 'imagen', maxBytes: 1000 },
        { id: 'animacion', etiqueta: 'Animación', tipo: 'booleano', rol: 'desarrollador' },
      ],
    },
    {
      id: 'precios',
      titulo: 'Precios',
      activable: true,
      campos: [
        {
          id: 'planes',
          etiqueta: 'Planes',
          tipo: 'lista',
          minItems: 1,
          campos: [
            { id: 'id', etiqueta: 'Id', tipo: 'texto' },
            { id: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
            { id: 'precio', etiqueta: 'Precio', tipo: 'precio', min: 0 },
            { id: 'destacado', etiqueta: 'Destacado', tipo: 'booleano', rol: 'desarrollador' },
          ],
        },
      ],
    },
    {
      id: 'reglas',
      titulo: 'Reglas',
      rol: 'desarrollador',
      campos: [{ id: 'iva', etiqueta: 'IVA', tipo: 'porcentaje', max: 1 }],
    },
  ],
};

describe('motor de edición', () => {
  it('genera contenido inicial con estructura', () => {
    const c = contenidoInicial(esquema);
    expect(c._estructura?.orden).toEqual(['portada', 'precios', 'reglas']);
    expect(c._estructura?.variantes).toEqual({ portada: 'centrada' });
  });

  it('valida obligatorios, largos, imágenes y listas', () => {
    const c = contenidoInicial(esquema);
    const errores = validarContenido(esquema, {
      ...c,
      portada: { titulo: 'Un título larguísimo de más', imagen: { url: '/x.png', bytes: 5000 } },
      precios: { planes: [{ nombre: '', precio: -1 }] },
    });
    const rutas = errores.map((e) => e.ruta);
    expect(rutas).toContain('portada.titulo');
    expect(rutas).toContain('portada.imagen');
    expect(rutas).toContain('portada.imagen.alt');
    expect(rutas).toContain('precios.planes.0.nombre');
    expect(rutas).toContain('precios.planes.0.precio');
  });

  it('las secciones ocultas no bloquean la publicación', () => {
    const c = contenidoInicial(esquema);
    c.portada = { titulo: 'Hola' };
    c._estructura!.ocultas = ['precios'];
    expect(validarContenido(esquema, c)).toEqual([]);
  });

  it('el administrador no ve campos ni secciones de desarrollador', () => {
    const vista = filtrarPorRol(esquema, 'administrador');
    expect(vista.secciones.map((s) => s.id)).toEqual(['portada', 'precios']);
    expect(vista.secciones[0]!.campos.map((c) => c.id)).toEqual(['titulo', 'imagen']);
    expect(vista.secciones[1]!.campos[0]!.campos!.map((c) => c.id)).not.toContain('destacado');
  });

  it('detecta y revierte cambios prohibidos de un administrador', () => {
    const antes = contenidoInicial(esquema);
    antes.precios = { planes: [{ id: 'p1', nombre: 'Básico', precio: 10, destacado: false }] };
    const despues = structuredClone(antes);
    (despues.portada as Record<string, unknown>).titulo = 'Nuevo';
    (despues.portada as Record<string, unknown>).animacion = true;
    (despues.precios as { planes: Record<string, unknown>[] }).planes[0]!.destacado = true;
    (despues.reglas as Record<string, unknown>).iva = 0.5;
    despues._estructura!.ocultas = ['portada'];

    expect(cambiosProhibidos(esquema, 'administrador', antes, despues).sort()).toEqual(
      ['_estructura', 'portada.animacion', 'precios.planes.p1.destacado', 'reglas'].sort(),
    );
    const seguro = fusionarSeguro(esquema, 'administrador', antes, despues);
    expect((seguro.portada as Record<string, unknown>).titulo).toBe('Nuevo'); // lo permitido se conserva
    expect(cambiosProhibidos(esquema, 'administrador', antes, seguro)).toEqual([]);
    expect(cambiosProhibidos(esquema, 'desarrollador', antes, despues)).toEqual([]);
  });

  it('completa contenido viejo cuando el esquema crece', () => {
    const viejo = { portada: { titulo: 'Hola' }, _estructura: { orden: ['portada'], ocultas: [], variantes: {} } };
    const c = completarContenido(esquema, viejo);
    expect(c._estructura!.orden).toEqual(['portada', 'precios', 'reglas']);
    expect((c.precios as Record<string, unknown>).planes).toEqual([]);
  });

  it('devuelve secciones visibles en orden con su variante', () => {
    const c = contenidoInicial(esquema);
    c._estructura = {
      orden: ['precios', 'portada', 'reglas'],
      ocultas: ['reglas'],
      variantes: { portada: 'dividida' },
    };
    expect(seccionesVisibles(esquema, c).map((s) => [s.id, s.variante])).toEqual([
      ['precios', undefined],
      ['portada', 'dividida'],
    ]);
  });

  it('revisa el propio esquema', () => {
    expect(revisarEsquema(esquema)).toEqual([]);
    expect(
      revisarEsquema({
        ...esquema,
        secciones: [{ id: 'x', titulo: 'X', campos: [{ id: 'a b', etiqueta: '', tipo: 'raro' }] }],
      }),
    ).toHaveLength(3);
  });
});
