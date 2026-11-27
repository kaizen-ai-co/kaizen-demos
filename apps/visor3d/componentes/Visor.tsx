'use client';

import {
  Center,
  ContactShadows,
  Environment,
  Html,
  Lightformer,
  OrbitControls,
  useGLTF,
  useProgress,
} from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { cn } from '@kaizen/ui';
import { RotateCcw } from 'lucide-react';
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import * as THREE from 'three';
import type { OrbitControls as ImplControles } from 'three-stdlib';
import { materialesPorMalla, type Escena, type Parte, type Seleccion, type V3, type VistaCamara } from '@/lib/tipos';
import { SillaProcedural } from './SillaProcedural';

/**
 * Visor 3D (solo cliente; se carga con next/dynamic ssr:false).
 * - Canvas con dpr [1, 1.75] y frameloop "demand": solo dibuja cuando algo cambia.
 * - Modelo .glb del contenido o silla procedural de demostración.
 * - Imagen de reserva si el dispositivo no admite WebGL.
 */

export interface ApiVisor {
  reiniciar: () => void;
  leerVista: () => VistaCamara;
}

export interface PropsVisor {
  modeloUrl?: string;
  partes: Parte[];
  seleccion: Seleccion;
  vista: VistaCamara;
  escena: Escena;
  imagenReserva?: { src: string; alt: string } | null;
  etiqueta: string;
  textoReiniciar?: string;
  textoCargando?: string;
  textoSinWebgl?: string;
  className?: string;
  alListo?: (api: ApiVisor) => void;
}

const r3 = (n: number) => Math.round(n * 1000) / 1000;

// Soporte de WebGL: se detecta una sola vez por página y no cambia (por eso no hay suscripción).
let webglDetectado: boolean | undefined;
function soportaWebgl(): boolean {
  if (webglDetectado === undefined) {
    try {
      const c = document.createElement('canvas');
      webglDetectado = !!(c.getContext('webgl2') ?? c.getContext('webgl'));
    } catch {
      webglDetectado = false;
    }
  }
  return webglDetectado;
}
const sinSuscripcion = () => () => {};

function Cargando({ texto }: { texto: string }) {
  const { progress } = useProgress();
  return (
    <Html center>
      <div
        role="status"
        className="whitespace-nowrap rounded-md bg-fondo px-3 py-1.5 text-xs font-medium text-texto shadow-md"
      >
        {texto} {Math.round(progress)} %
      </div>
    </Html>
  );
}

function Controles({ vista, alListo }: { vista: VistaCamara; alListo?: (api: ApiVisor) => void }) {
  const controles = useRef<ImplControles>(null);
  const invalidate = useThree((s) => s.invalidate);
  const callback = useRef(alListo);
  // La referencia al callback se actualiza después del render, nunca durante.
  useLayoutEffect(() => {
    callback.current = alListo;
  });
  const clave = `${vista.posicion.join()}|${vista.objetivo.join()}|${vista.fov}`;

  useEffect(() => {
    const c = controles.current;
    if (!c) return;
    // La cámara que mueven los controles (la misma de la escena): se modifica de forma imperativa,
    // como pide three.js, sin tocar el valor que devuelve un hook.
    const camera = c.object as THREE.PerspectiveCamera;
    const aplicar = () => {
      camera.position.set(...vista.posicion);
      camera.fov = vista.fov;
      camera.updateProjectionMatrix();
      c.target.set(...vista.objetivo);
      c.update();
      invalidate();
    };
    aplicar();
    callback.current?.({
      reiniciar: aplicar,
      leerVista: () => ({
        posicion: camera.position.toArray().map(r3) as V3,
        objetivo: c.target.toArray().map(r3) as V3,
        fov: r3(camera.fov),
      }),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, invalidate]);

  return (
    <OrbitControls
      ref={controles}
      makeDefault
      enableDamping={false}
      minDistance={0.8}
      maxDistance={8}
      maxPolarAngle={Math.PI / 2.02}
    />
  );
}

function ModeloGLB({ url, materiales }: { url: string; materiales: ReturnType<typeof materialesPorMalla> }) {
  const { scene } = useGLTF(url, true);
  const invalidate = useThree((s) => s.invalidate);
  const { copia, escala } = useMemo(() => {
    const copia = scene.clone(true);
    const caja = new THREE.Box3().setFromObject(copia);
    const tam = caja.getSize(new THREE.Vector3());
    return { copia, escala: 1.4 / Math.max(tam.x, tam.y, tam.z, 0.001) };
  }, [scene]);

  useEffect(() => {
    copia.traverse((o) => {
      const malla = o as THREE.Mesh;
      if (!malla.isMesh) return;
      // Guardamos el material original para clonar siempre desde él (sin acumular cambios).
      malla.userData.originales ??= malla.material;
      const originales = malla.userData.originales as THREE.Material | THREE.Material[];
      const lista = Array.isArray(originales) ? originales : [originales];
      const previos = Array.isArray(malla.material) ? malla.material : [malla.material];
      const nuevos = lista.map((m) => {
        const opcion = materiales[malla.name] ?? materiales[m.name];
        if (!opcion) return m;
        const c = m.clone() as THREE.MeshStandardMaterial;
        if (c.color) c.color.set(opcion.color);
        if (opcion.rugosidad !== undefined && 'roughness' in c) c.roughness = opcion.rugosidad;
        if (opcion.metalicidad !== undefined && 'metalness' in c) c.metalness = opcion.metalicidad;
        return c;
      });
      previos.forEach((m) => !lista.includes(m) && m.dispose());
      malla.material = Array.isArray(originales) ? nuevos : nuevos[0]!;
    });
    invalidate();
  }, [copia, materiales, invalidate]);

  return (
    <Center top>
      <primitive object={copia} scale={escala} />
    </Center>
  );
}

function Entorno({ preset }: { preset: string }) {
  if (preset === 'local') {
    // Luces de estudio generadas en código: no descarga nada.
    return (
      <Environment resolution={128}>
        <Lightformer intensity={2} position={[0, 4, 2]} scale={[6, 2, 1]} />
        <Lightformer intensity={1} position={[-4, 2, -1]} rotation-y={Math.PI / 2} scale={[4, 2, 1]} />
        <Lightformer intensity={1} position={[4, 2, -1]} rotation-y={-Math.PI / 2} scale={[4, 2, 1]} />
      </Environment>
    );
  }
  return <Environment preset={preset as 'studio'} />;
}

export default function Visor({
  modeloUrl,
  partes,
  seleccion,
  vista,
  escena,
  imagenReserva,
  etiqueta,
  textoReiniciar = 'Reiniciar vista',
  textoCargando = 'Cargando modelo…',
  textoSinWebgl = 'Tu dispositivo no admite 3D; te mostramos una imagen.',
  className,
  alListo,
}: PropsVisor) {
  // null en el servidor; en el navegador, si hay WebGL (sin setState dentro de un efecto).
  const webgl = useSyncExternalStore(sinSuscripcion, soportaWebgl, () => null);
  const api = useRef<ApiVisor | null>(null);
  const materiales = useMemo(() => materialesPorMalla(partes, seleccion), [partes, seleccion]);

  if (webgl === false) {
    return (
      <div className={cn('relative overflow-hidden rounded-xl border border-borde bg-superficie', className)}>
        {imagenReserva && (
          <img src={imagenReserva.src} alt={imagenReserva.alt} className="h-full w-full object-contain" />
        )}
        <p className="absolute inset-x-0 bottom-0 bg-fondo/90 p-2 text-center text-xs text-suave">{textoSinWebgl}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-borde',
        !escena.fondo && 'bg-superficie',
        className,
      )}
      style={escena.fondo ? { background: escena.fondo } : undefined}
    >
      {webgl && (
        <Canvas
          dpr={[1, 1.75]}
          frameloop="demand"
          camera={{ position: vista.posicion, fov: vista.fov }}
          aria-label={etiqueta}
          role="img"
          gl={{ antialias: true, preserveDrawingBuffer: false }}
        >
          <ambientLight intensity={0.35 * escena.iluminacion} />
          <directionalLight position={[3, 5, 2]} intensity={escena.iluminacion} />
          <Suspense fallback={<Cargando texto={textoCargando} />}>
            {modeloUrl ? (
              <ModeloGLB url={modeloUrl} materiales={materiales} />
            ) : (
              <SillaProcedural materiales={materiales} />
            )}
            <ContactShadows position={[0, 0, 0]} opacity={0.45} scale={5} blur={2.2} far={1.6} frames={1} />
            <Entorno preset={escena.entorno} />
          </Suspense>
          <Controles
            vista={vista}
            alListo={(a) => {
              api.current = a;
              alListo?.(a);
            }}
          />
        </Canvas>
      )}
      <button
        type="button"
        onClick={() => api.current?.reiniciar()}
        className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-md border border-borde bg-fondo/90 px-3 py-1.5 text-xs font-semibold text-texto shadow-sm hover:bg-fondo"
      >
        <RotateCcw aria-hidden className="size-3.5" /> {textoReiniciar}
      </button>
    </div>
  );
}
