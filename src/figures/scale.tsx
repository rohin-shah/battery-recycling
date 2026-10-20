import { useMemo } from 'react'
import { concreteGrid } from './textures'

/** Scale references, in metres: a 1.75 m person for machines, a ~15 cm phone for hand-sized parts. */

/** A plain standing figure, 1.75 m tall, feet at y = 0. */
export function Person({ position }: { position: [number, number, number] }) {
  const skin = '#c9b8a6'
  const cloth = '#5f6b73'
  return (
    <group position={position}>
      {[-0.1, 0.1].map((x) => (
        <mesh key={x} position={[x, 0.42, 0]}>
          <capsuleGeometry args={[0.07, 0.7, 4, 8]} />
          <meshStandardMaterial color={cloth} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 1.15, 0]}>
        <capsuleGeometry args={[0.18, 0.4, 4, 10]} />
        <meshStandardMaterial color={cloth} roughness={0.8} />
      </mesh>
      {[-0.25, 0.25].map((x) => (
        <mesh key={x} position={[x, 1.1, 0]}>
          <capsuleGeometry args={[0.05, 0.5, 4, 8]} />
          <meshStandardMaterial color={cloth} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 1.62, 0]}>
        <sphereGeometry args={[0.12, 16, 12]} />
        <meshStandardMaterial color={skin} roughness={0.7} />
      </mesh>
    </group>
  )
}

/** A generic smartphone, 147 × 72 × 8 mm, lying flat. */
export function Phone({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.004, 0]}>
        <boxGeometry args={[0.072, 0.008, 0.147]} />
        <meshStandardMaterial color="#2a2d31" roughness={0.3} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.0085, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.064, 0.137]} />
        <meshStandardMaterial color="#3d5a73" roughness={0.15} emissive="#2a4a66" emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}

/** The factory floor, centred on `x` and `width` metres long, with a 1 m grid. */
export function Floor({ x = 0, width = 40 }: { x?: number; width?: number }) {
  const map = useMemo(() => {
    const t = concreteGrid().clone()
    t.repeat.set(width, 16)
    t.needsUpdate = true
    return t
  }, [width])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0, 0]}>
      <planeGeometry args={[width, 16]} />
      <meshStandardMaterial map={map} roughness={1} />
    </mesh>
  )
}
