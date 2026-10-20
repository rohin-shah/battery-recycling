import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { MathUtils, type Mesh, type MeshStandardMaterial } from 'three'
import { ENCODING } from './encoding'

export type LifeStage = 'car' | 'storage' | 'recycling'

const MODULES = 8
type Vec = [number, number, number]

/** Where module i sits at each stage: in the pack (left), racked as stationary storage (right), or piled for recycling (front). */
const target = (stage: LifeStage, i: number): Vec => {
  if (stage === 'car') return [-1.3 + ((i % 4) - 1.5) * 0.42, 0, (Math.floor(i / 4) - 0.5) * 0.62]
  if (stage === 'storage') return [1.1 + (i % 2) * 0.5, -0.55 + Math.floor(i / 2) * 0.32, 0]
  return [((i % 4) - 1.5) * 0.3, -0.75 + Math.floor(i / 4) * 0.12, 1.1 + (i % 3) * 0.1]
}

/** A pack leaves the car at 80% capacity, its modules serve as stationary storage until 60%, then go for recycling. */
export function SecondLifeFigure({ stage }: { stage: LifeStage }) {
  return (
    // Small enough that the outermost pieces stay in frame through a full turn on a square phone figure.
    <group scale={0.62}>
      <Casing visible={stage === 'car'} />
      {/* The storage rack's frame, always shown so the destination is visible before the pack arrives */}
      <mesh position={[1.35, -0.05, -0.2]}>
        <boxGeometry args={[1.15, 1.45, 0.08]} />
        <meshStandardMaterial color={ENCODING.casing} transparent opacity={0.25} />
      </mesh>
      {Array.from({ length: MODULES }, (_, i) => (
        <Module key={i} stage={stage} index={i} />
      ))}
    </group>
  )
}

function Casing({ visible }: { visible: boolean }) {
  const mat = useRef<MeshStandardMaterial>(null)
  useFrame((_, dt) => {
    if (mat.current) mat.current.opacity = MathUtils.damp(mat.current.opacity, visible ? 0.35 : 0, 5, dt)
  })
  return (
    <mesh position={[-1.3, 0, 0]}>
      <boxGeometry args={[1.9, 0.4, 1.45]} />
      <meshStandardMaterial ref={mat} color={ENCODING.casing} transparent opacity={0.35} depthWrite={false} />
    </mesh>
  )
}

function Module({ stage, index }: { stage: LifeStage; index: number }) {
  const mesh = useRef<Mesh>(null)
  const wait = useRef(0)
  const shownStage = useRef(stage)
  useFrame((_, dt) => {
    const m = mesh.current
    if (!m) return
    // Stagger the modules so they move one after another rather than as a block.
    if (shownStage.current !== stage) {
      shownStage.current = stage
      wait.current = index * 0.04
    }
    if (wait.current > 0) {
      wait.current -= dt
      return
    }
    const [x, y, z] = target(stage, index)
    m.position.set(MathUtils.damp(m.position.x, x, 5, dt), MathUtils.damp(m.position.y, y, 5, dt), MathUtils.damp(m.position.z, z, 5, dt))
  })
  return (
    <mesh ref={mesh} position={target('car', index)}>
      <boxGeometry args={[0.38, 0.26, 0.55]} />
      <meshStandardMaterial color={stage === 'recycling' ? ENCODING.blackMass : ENCODING.cell} roughness={0.6} />
    </mesh>
  )
}
