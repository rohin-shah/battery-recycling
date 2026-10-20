import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import { Object3D, type Group, type InstancedMesh } from 'three'
import { ENCODING } from './encoding'

// shortcut: Phase 4 stand-ins to prove the figure system; Phase 5 replaces each with its chapter's real figure.

export function PackPlaceholder() {
  const modules = Array.from({ length: 8 }, (_, i) => [((i % 4) - 1.5) * 0.62, 0, (Math.floor(i / 4) - 0.5) * 0.9] as const)
  return (
    <group>
      <mesh>
        <boxGeometry args={[2.8, 0.5, 2.1]} />
        <meshStandardMaterial color={ENCODING.casing} transparent opacity={0.35} roughness={0.5} />
      </mesh>
      {modules.map((p, i) => (
        <mesh key={i} position={p}>
          <boxGeometry args={[0.55, 0.35, 0.8]} />
          <meshStandardMaterial color={ENCODING.cell} roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
}

const COUNT = 2000

/** A pile of instanced flecks, to load-test the shared canvas. */
export function BlackMassPlaceholder() {
  const mesh = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const o = new Object3D()
    for (let i = 0; i < COUNT; i++) {
      const r = Math.sqrt(Math.random()) * 1.3
      const a = Math.random() * Math.PI * 2
      o.position.set(Math.cos(a) * r, Math.random() * (1.3 - r) * 0.9 - 0.4, Math.sin(a) * r)
      o.scale.setScalar(0.03 + Math.random() * 0.04)
      o.updateMatrix()
      mesh.current!.setMatrixAt(i, o.matrix)
    }
    mesh.current!.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={ENCODING.blackMass} roughness={0.9} />
    </instancedMesh>
  )
}

/** A metal ion with orbiting water molecules, animated every frame. */
export function IonPlaceholder() {
  const shell = useRef<Group>(null)
  useFrame((_, dt) => {
    if (shell.current) shell.current.rotation.x += dt * 0.6
  })
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.45, 32, 16]} />
        <meshStandardMaterial color={ENCODING.recovered} roughness={0.4} />
      </mesh>
      <group ref={shell}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 1.1, Math.sin(a) * 1.1, 0]}>
              <sphereGeometry args={[0.18, 16, 8]} />
              <meshStandardMaterial color={ENCODING.casing} roughness={0.5} />
            </mesh>
          )
        })}
      </group>
    </group>
  )
}
