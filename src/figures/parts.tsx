import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { MathUtils, Object3D, type Group, type InstancedMesh, type MeshStandardMaterial } from 'three'
import { ENCODING } from './encoding'

export type Vec = [number, number, number]

/** Glides its children to a position and scale whenever they change. */
export function Mover({ to, scale = 1, children }: { to: Vec; scale?: number; children: ReactNode }) {
  const g = useRef<Group>(null)
  useFrame((_, dt) => {
    if (!g.current) return
    const p = g.current.position
    p.set(MathUtils.damp(p.x, to[0], 5, dt), MathUtils.damp(p.y, to[1], 5, dt), MathUtils.damp(p.z, to[2], 5, dt))
    g.current.scale.setScalar(MathUtils.damp(g.current.scale.x, scale, 6, dt))
  })
  return (
    <group ref={g} position={to} scale={scale}>
      {children}
    </group>
  )
}

/** Deterministic pseudo-random numbers, so a pile looks the same on every render. */
function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
}

/** A conical heap of small flecks: black mass, slag, a salt. */
export function Pile({ color, count = 300, radius = 0.5, seed = 1 }: { color: string; count?: number; radius?: number; seed?: number }) {
  const mesh = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const rand = seeded(seed)
    const o = new Object3D()
    for (let i = 0; i < count; i++) {
      const r = Math.sqrt(rand()) * radius
      const a = rand() * Math.PI * 2
      o.position.set(Math.cos(a) * r, rand() * (radius - r) * 0.8, Math.sin(a) * r)
      o.scale.setScalar(radius * (0.05 + rand() * 0.05))
      o.updateMatrix()
      mesh.current!.setMatrixAt(i, o.matrix)
    }
    mesh.current!.instanceMatrix.needsUpdate = true
  }, [count, radius, seed])
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </instancedMesh>
  )
}

/** A battery module. Glows violet while it still holds charge (violet = energy). */
export function Module({ charged = false, color = ENCODING.cell }: { charged?: boolean; color?: string }) {
  const mat = useRef<MeshStandardMaterial>(null)
  useFrame((_, dt) => {
    if (mat.current) mat.current.emissiveIntensity = MathUtils.damp(mat.current.emissiveIntensity, charged ? 0.6 : 0, 3, dt)
  })
  return (
    <mesh>
      <boxGeometry args={[0.38, 0.26, 0.55]} />
      <meshStandardMaterial ref={mat} color={color} emissive={ENCODING.heat} emissiveIntensity={charged ? 0.6 : 0} roughness={0.6} />
    </mesh>
  )
}

/** Eight modules in a 4 × 2 grid, centred on the origin. */
export const moduleGrid = (i: number): Vec => [((i % 4) - 1.5) * 0.42, 0, (Math.floor(i / 4) - 0.5) * 0.62]
