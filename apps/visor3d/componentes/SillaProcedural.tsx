'use client';

import type { OpcionParte } from '@/lib/tipos';

/**
 * Objeto de demostración propio (CC0): una silla hecha con geometrías de three.
 * Mallas nombradas para el configurador: "asiento", "respaldo" y "patas".
 * Se usa cuando el contenido no trae un modelo .glb subido.
 */
const PATAS: [number, number][] = [[-0.38, -0.38], [0.38, -0.38], [-0.38, 0.38], [0.38, 0.38]];

export function SillaProcedural({ materiales }: { materiales: Record<string, OpcionParte> }) {
  const material = (malla: string, porDefecto: string) => {
    const o = materiales[malla];
    return <meshStandardMaterial color={o?.color ?? porDefecto} roughness={o?.rugosidad ?? 0.6} metalness={o?.metalicidad ?? 0} />;
  };
  return (
    <group>
      <mesh name="asiento" position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.92, 0.09, 0.92]} />
        {material('asiento', '#c2410c')}
      </mesh>
      <mesh name="respaldo" position={[0, 0.96, -0.42]} castShadow>
        <boxGeometry args={[0.92, 0.9, 0.08]} />
        {material('respaldo', '#b07a45')}
      </mesh>
      {PATAS.map(([x, z]) => (
        <mesh key={`${x}${z}`} name="patas" position={[x, 0.2, z]} castShadow>
          <cylinderGeometry args={[0.035, 0.028, 0.41, 16]} />
          {material('patas', '#8b5a2b')}
        </mesh>
      ))}
    </group>
  );
}
