import { useFrame } from '@react-three/fiber'
import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { MathUtils, Object3D, type InstancedMesh } from 'three'
import type { Vec } from './parts'

/**
 * Animation between steps is driven by a continuous `progress` from the reader's scrubber: 1.4 means 40% of the way
 * through the transition into step 2. Dragging plays the work forwards or backwards at the reader's pace.
 */

export type Clock = { step: number; t: number }
const StepContext = createContext<RefObject<Clock> | null>(null)

export const ease = (x: number) => MathUtils.smootherstep(MathUtils.clamp(x, 0, 1), 0, 1)
/** Progress within a window [a, b] of the transition, 0 → 1. */
export const within = (t: number, a: number, b: number) => ease((t - a) / (b - a))

/** The step being entered and how far into its transition: progress 0 → step 0 settled; 0.3 → step 1 at t = 0.3. */
export function split(progress: number): Clock {
  const step = progress <= 0 ? 0 : Math.ceil(progress - 1e-6)
  return { step, t: step === 0 ? 1 : 1 - (step - progress) }
}

export function StepClock({ progress, children }: { progress: number; children: ReactNode }) {
  const clock = useRef<Clock>(split(progress))
  useLayoutEffect(() => {
    clock.current = split(progress)
  })
  return <StepContext.Provider value={clock}>{children}</StepContext.Provider>
}

/** The live clock: `t` runs 0 → 1 through the transition into `step`, and stays at 1 after. */
export function useClock() {
  const c = useContext(StepContext)
  if (!c) throw new Error('useClock needs a StepClock')
  return c
}

/**
 * A stream of particles carrying material from `from` to `to` along an arc, during [start, end] of the transition into
 * `step`. Shapes are small boxes (pieces) or spheres (powder, gas).
 */
export function Flow({ step, from, to, color, count = 24, size = 0.08, arc = 1, start = 0.1, end = 0.8, shape = 'box', opacity = 1 }: {
  step: number
  from: Vec
  to: Vec
  color: string
  count?: number
  size?: number
  arc?: number
  start?: number
  end?: number
  shape?: 'box' | 'sphere'
  opacity?: number
}) {
  const clock = useClock()
  const mesh = useRef<InstancedMesh>(null)
  const [o] = useState(() => new Object3D())
  useLayoutEffect(() => {
    o.scale.setScalar(0)
    o.updateMatrix()
    for (let i = 0; i < count; i++) mesh.current!.setMatrixAt(i, o.matrix)
    mesh.current!.instanceMatrix.needsUpdate = true
  }, [count, o])
  useFrame(() => {
    const m = mesh.current
    if (!m) return
    const { step: s, t } = clock.current
    const running = s === step && t < 1
    for (let i = 0; i < count; i++) {
      // Each particle leaves a little after the one before and takes 40% of the window to arrive.
      const u = running ? MathUtils.clamp((t - start - (i / count) * (end - start) * 0.6) / ((end - start) * 0.4), 0, 1) : 0
      const flying = u > 0 && u < 1
      o.position.set(
        MathUtils.lerp(from[0], to[0], u),
        MathUtils.lerp(from[1], to[1], u) + Math.sin(u * Math.PI) * arc,
        MathUtils.lerp(from[2], to[2], u) + Math.sin(i * 12.9) * 0.15,
      )
      o.rotation.set(u * 6 + i, u * 4, 0)
      o.scale.setScalar(flying ? size * (0.7 + ((i * 7) % 5) / 10) : 0)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      {shape === 'box' ? <boxGeometry args={[1, 0.6, 1]} /> : <sphereGeometry args={[0.5, 10, 8]} />}
      <meshStandardMaterial color={color} roughness={0.7} transparent={opacity < 1} opacity={opacity} depthWrite={opacity === 1} />
    </instancedMesh>
  )
}

/** Scales its children from 0 to 1 over [start, end] of the transition into `step`, and holds at 1 afterwards. */
export function GrowIn({ step, start = 0.4, end = 1, children }: { step: number; start?: number; end?: number; children: ReactNode }) {
  const clock = useClock()
  const g = useRef<Object3D>(null)
  useFrame(() => {
    if (!g.current) return
    const { step: s, t } = clock.current
    g.current.scale.setScalar(s === step ? Math.max(0.001, within(t, start, end)) : 1)
  })
  return <group ref={g}>{children}</group>
}
