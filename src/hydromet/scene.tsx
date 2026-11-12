import { ContactShadows, Environment, Html, Lightformer, OrthographicCamera } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { Color, LatheGeometry, MathUtils, Object3D, Vector2, type InstancedMesh } from 'three'
import { LIQUID_TOP, R, TUBE, type Vec } from './layout'

/**
 * The shared stage for the hydrometallurgy figures: a glass beaker on a slab, seen from one fixed isometric viewpoint
 * on a dark panel, with a dosing tube above it. Everything that moves is a bead in one instanced mesh, and every bead
 * is there from the start: the slider only changes where each one is.
 */

/** Where a bead should be for a slider value: either a place of its own, or riding on another bead. */
export type Aim = { color: string } & ({ to: Vec; jig?: number } | { on: number; offset: Vec })
export type Bead = { size: number; aim: (value: number) => Aim }

const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function Beads({ beads, value }: { beads: Bead[]; value: number }) {
  const mesh = useRef<InstancedMesh>(null)
  const state = useRef<Vec[] | null>(null)
  const [o, c] = useMemo(() => [new Object3D(), new Color()], [])
  useFrame(({ clock }, dt) => {
    const m = mesh.current
    if (!m) return
    const t = clock.elapsedTime
    const calm = still()
    const aims = beads.map((b) => b.aim(value))
    // First frame: start every bead where it belongs, so nothing flies in.
    if (!state.current) {
      const start: Vec[] = aims.map((a) => ('to' in a ? [...a.to] : [0, 0, 0]))
      aims.forEach((a, i) => {
        if ('on' in a) start[i] = [start[a.on][0] + a.offset[0], start[a.on][1] + a.offset[1], start[a.on][2] + a.offset[2]]
      })
      state.current = start
    }
    const s = state.current
    // Beads with a place of their own move first; riders then follow whatever they sit on.
    for (const riders of [false, true]) {
      aims.forEach((a, i) => {
        if ('on' in a !== riders) return
        for (let k = 0; k < 3; k++) {
          const goal = 'on' in a ? s[a.on][k] + a.offset[k] : a.to[k] + (calm ? 0 : Math.sin(t * (0.9 + k * 0.3) + i * (k + 1)) * (a.jig ?? 0))
          s[i][k] = MathUtils.damp(s[i][k], goal, 'on' in a ? 6 : 3, dt)
        }
      })
    }
    beads.forEach((b, i) => {
      o.position.set(s[i][0], s[i][1], s[i][2])
      o.scale.setScalar(b.size)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
      m.setColorAt(i, c.set(aims[i].color))
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, beads.length]} frustumCulled={false}>
      <sphereGeometry args={[1, 20, 14]} />
      <meshPhysicalMaterial roughness={0.45} clearcoat={0.2} envMapIntensity={0.55} />
    </instancedMesh>
  )
}

function Beaker() {
  // A thick-walled glass profile, turned on a lathe: outer wall, rolled lip, inner wall, base.
  const glass = useMemo(() => {
    const p = [
      [0, 0], [R + 0.06, 0], [R + 0.08, 0.04], [R + 0.08, 1.85], [R + 0.13, 1.92], [R + 0.1, 1.95], [R, 1.9], [R, 0.08], [0, 0.08],
    ].map(([x, y]) => new Vector2(x, y))
    return new LatheGeometry(p, 72)
  }, [])
  return (
    <group>
      <mesh geometry={glass}>
        <meshPhysicalMaterial color="#cfe6ea" transparent opacity={0.12} roughness={0.05} clearcoat={1} depthWrite={false} side={2} />
      </mesh>
      <mesh position={[0, (LIQUID_TOP + 0.08) / 2, 0]}>
        <cylinderGeometry args={[R - 0.01, R - 0.01, LIQUID_TOP - 0.08, 72]} />
        <meshPhysicalMaterial color="#7fb7c4" transparent opacity={0.08} roughness={0.1} depthWrite={false} />
      </mesh>
      {/* Liquid surface */}
      <mesh position={[0, LIQUID_TOP, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[R - 0.01, 72]} />
        <meshPhysicalMaterial color="#a9d6df" transparent opacity={0.3} roughness={0.05} depthWrite={false} />
      </mesh>
    </group>
  )
}

export type SceneLabel = { at: Vec; text: string }

function Scene({ labels, zoomIn, focus, children }: { labels: SceneLabel[]; zoomIn: number; focus: number; children: ReactNode }) {
  // Labels mount a frame late: drei's Html needs the canvas attached first.
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])
  // Narrow panels: zoom out and slide the scene left so the labels fit beside the beaker.
  const width = useThree((t) => t.size.width)
  const zoom = Math.min(124, width * (width < 420 ? 0.22 : 0.24)) * zoomIn
  const k = width < 420 ? 0.62 : 0.3 // shift along the camera's right-hand axis
  return (
    <>
      <OrthographicCamera key={`${k} ${focus}`} makeDefault position={[6 + k, 4.6 + focus - 0.86, 6 - k]} zoom={zoom} onUpdate={(c) => c.lookAt(k, focus, -k)} />
      {/* Studio lighting built in the scene, so nothing is downloaded */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={4} position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[8, 8, 1]} />
        <Lightformer form="rect" intensity={2.5} position={[-6, 2, 2]} rotation={[0, Math.PI / 2, 0]} scale={[6, 4, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[5, 1.5, -4]} rotation={[0, -Math.PI / 3, 0]} scale={[5, 3, 1]} color="#9bb8ff" />
      </Environment>
      <directionalLight position={[3, 6, 2]} intensity={1.2} />
      {/* Slab */}
      <mesh position={[0, -0.12, 0]}>
        <boxGeometry args={[2.15, 0.24, 2.15]} />
        <meshStandardMaterial color="#2b3a34" roughness={0.7} />
      </mesh>
      <ContactShadows position={[0, 0.005, 0]} scale={4} blur={2.4} opacity={0.55} frames={1} />
      <Beaker />
      {/* Dosing tube */}
      <mesh position={[TUBE[0], TUBE[1] + 0.31, TUBE[2]]}>
        <cylinderGeometry args={[0.17, 0.17, 0.62, 40, 1, true]} />
        <meshPhysicalMaterial color="#cfe6ea" transparent opacity={0.2} roughness={0.05} clearcoat={1} depthWrite={false} side={2} />
      </mesh>
      {children}
      {ready &&
        labels.map((l) => (
          <Html key={l.text} position={l.at} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
            <span className="hm-tag">{l.text}</span>
          </Html>
        ))}
    </>
  )
}

/** The 3D view. The canvas only exists while the figure is on or near the screen. */
export function Stage({ label, labels, zoomIn = 1.35, focus = 1.05, children }: { label: string; labels: SceneLabel[]; zoomIn?: number; focus?: number; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: '300px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={box} className="hm-view" role="img" aria-label={label}>
      {near && (
        <Canvas dpr={[1, 2]} gl={{ antialias: true }} flat aria-hidden>
          <Scene labels={labels} zoomIn={zoomIn} focus={focus}>{children}</Scene>
        </Canvas>
      )}
    </div>
  )
}
