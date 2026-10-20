import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Mesh } from 'three'
import { MathUtils } from 'three'
import { ENCODING } from './encoding'
import type { Vec } from './parts'

export const HYDROMET_STEPS = ['Black mass in acid', 'Leached', 'Impurities out', 'Solvent extraction', 'Lithium precipitated']

type Element = 'nickel' | 'cobalt' | 'manganese' | 'lithium' | 'iron' | 'aluminium' | 'copper'
const IONS: [Element, number][] = [
  ['nickel', 9],
  ['cobalt', 4],
  ['manganese', 4],
  ['lithium', 6],
  ['iron', 2],
  ['aluminium', 2],
  ['copper', 2],
]
const LIST = IONS.flatMap(([e, n]) => Array.from({ length: n }, (_, i) => ({ e, i })))
const IMPURITY = new Set<Element>(['iron', 'aluminium', 'copper'])
/** Each extracted metal ends in its own stream, beside the beaker. */
const STREAM_X: Partial<Record<Element, number>> = { cobalt: 1.0, nickel: 1.55, manganese: 2.1 }

const BEAKER: Vec = [-0.6, 0, 0]
const R = 0.85
const H = 1.7

/** A fixed pseudo-random point per ion, so every reader sees the same solution. */
const rand = (k: number) => {
  const x = Math.sin(k * 127.1) * 43758.5453
  return x - Math.floor(x)
}

function target(e: Element, i: number, k: number, step: number): { at: Vec; free: boolean } {
  const [bx, , bz] = BEAKER
  const floor = -H / 2 + 0.1
  if (step === 0) {
    // Still solid: packed in one particle at the bottom of the beaker.
    const a = rand(k) * Math.PI * 2
    const r = rand(k + 50) * 0.22
    return { at: [bx + Math.cos(a) * r, floor + 0.15 + rand(k + 99) * 0.2, bz + Math.sin(a) * r], free: false }
  }
  if (step >= 2 && IMPURITY.has(e)) return { at: [bx - 0.4 + i * 0.12 + (e === 'copper' ? 0.5 : e === 'iron' ? 0.25 : 0), floor, bz - 0.3], free: false }
  if (step >= 3 && STREAM_X[e] !== undefined) return { at: [STREAM_X[e]!, -0.6 + i * 0.17, 0], free: false }
  if (step >= 4 && e === 'lithium') return { at: [bx + 0.25 + (i % 3) * 0.12, floor, bz + 0.3 + Math.floor(i / 3) * 0.12], free: false }
  // Dissolved: anywhere in the solution, drifting.
  const a = rand(k) * Math.PI * 2
  const r = Math.sqrt(rand(k + 7)) * (R - 0.15)
  return { at: [bx + Math.cos(a) * r, floor + 0.15 + rand(k + 13) * (H - 0.5), bz + Math.sin(a) * r], free: true }
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function Ion({ e, i, k, step }: { e: Element; i: number; k: number; step: number }) {
  const mesh = useRef<Mesh>(null)
  useFrame(({ clock }, dt) => {
    const m = mesh.current
    if (!m) return
    const { at, free } = target(e, i, k, step)
    // Dissolved ions jostle; solids sit still.
    const t = clock.elapsedTime
    const j = free && !reducedMotion() ? 0.04 : 0
    const goal: Vec = [at[0] + Math.sin(t * 1.3 + k) * j, at[1] + Math.cos(t * 1.1 + k * 2) * j, at[2] + Math.sin(t * 0.9 + k * 3) * j]
    m.position.set(MathUtils.damp(m.position.x, goal[0], 4, dt), MathUtils.damp(m.position.y, goal[1], 4, dt), MathUtils.damp(m.position.z, goal[2], 4, dt))
  })
  return (
    <mesh ref={mesh} position={target(e, i, k, 0).at}>
      <sphereGeometry args={[e === 'lithium' ? 0.06 : 0.08, 16, 12]} />
      <meshStandardMaterial color={ENCODING[e]} roughness={0.45} />
    </mesh>
  )
}

/** Ions in a beaker of sulphuric acid: dissolved, purified, separated metal by metal, lithium last. */
export function HydrometFigure({ step }: { step: number }) {
  return (
    <group scale={0.75} position={[-0.3, 0, 0]}>
      {/* Beaker and acid */}
      <mesh position={BEAKER}>
        <cylinderGeometry args={[R, R, H, 48, 1, true]} />
        <meshStandardMaterial color="#c9d6d4" transparent opacity={0.25} depthWrite={false} side={2} />
      </mesh>
      <mesh position={[BEAKER[0], -0.15, BEAKER[2]]}>
        <cylinderGeometry args={[R - 0.02, R - 0.02, H - 0.4, 48]} />
        <meshStandardMaterial color="#dfe8e0" transparent opacity={0.18} depthWrite={false} />
      </mesh>
      {/* Organic solvent phase, shown once extraction starts */}
      {step >= 3 &&
        Object.values(STREAM_X).map((x) => (
          <mesh key={x} position={[x, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 1.6, 24]} />
            <meshStandardMaterial color={ENCODING.cell} transparent opacity={0.2} depthWrite={false} />
          </mesh>
        ))}
      {LIST.map(({ e, i }, k) => (
        <Ion key={k} e={e} i={i} k={k} step={step} />
      ))}
    </group>
  )
}
