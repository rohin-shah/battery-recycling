import { ContactShadows, Environment, Html, Lightformer, OrthographicCamera } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Color, LatheGeometry, MathUtils, Object3D, Vector2, type InstancedMesh } from 'three'
import { METALS, PH_MAX, PH_MIN, settled, type Metal } from './data'

/**
 * Pilot, Figure A: the impurity window. One control (how acidic the solution is); everything shown is computed from
 * the measured data. Fixed isometric view on a dark panel; every bead is there from the start and only moves between
 * drifting (dissolved) and resting on the bottom (settled out).
 */

// Stronger than the site palette so six metals stay distinct on the dark panel.
const COLOUR: Record<Metal, string> = {
  iron: '#d2601f',
  aluminium: '#f1f4f4', // aluminium hydroxide is white
  nickel: '#3fbf5f',
  cobalt: '#2f6ff0',
  manganese: '#b45ae0',
  lithium: '#f2cf2e',
}
/** Beads per metal: illustrative proportions, not concentrations. */
const BEADS: Record<Metal, number> = { iron: 10, aluminium: 14, nickel: 16, cobalt: 10, manganese: 10, lithium: 12 }
const NAME: Record<Metal, string> = { iron: 'Iron', aluminium: 'Aluminium', nickel: 'Nickel', cobalt: 'Cobalt', manganese: 'Manganese', lithium: 'Lithium' }

const R = 0.9 // beaker inner radius
const LIQUID_TOP = 1.45
const hash = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453
  return x - Math.floor(x)
}

type Bead = { metal: Metal; rank: number; drift: [number, number, number]; rest: [number, number, number] }
const ALL: Bead[] = (() => {
  const out: Bead[] = []
  let slot = 0
  for (const metal of METALS) {
    for (let i = 0; i < BEADS[metal]; i++, slot++) {
      const k = out.length
      const a = hash(k, 1) * Math.PI * 2
      const r = Math.sqrt(hash(k, 2)) * (R - 0.16)
      // Resting place: a sunflower-packed bed on the bottom, two beads deep.
      const ra = slot * 2.39996
      const rr = Math.sqrt(((slot % 36) + 0.5) / 36) * (R - 0.14)
      out.push({
        metal,
        rank: (i + 0.5) / BEADS[metal],
        drift: [Math.cos(a) * r, 0.4 + hash(k, 3) * (LIQUID_TOP - 0.55), Math.sin(a) * r],
        rest: [Math.cos(ra) * rr, 0.13 + Math.floor(slot / 36) * 0.11, Math.sin(ra) * rr],
      })
    }
  }
  // Rest slots are handed out in the order beads settle as pH rises, so the sludge grows as one compact pile
  // from the middle outwards.
  const settlesAt = (b: Bead) => {
    for (let pH = PH_MIN; pH <= PH_MAX; pH += 0.01) if (b.rank < settled(b.metal, pH) / 100) return pH
    return Infinity
  }
  const order = out.map((b, i) => [settlesAt(b), i] as const).sort((a, b) => a[0] - b[0] || a[1] - b[1])
  order.forEach(([, i], slot) => {
    const a = slot * 2.39996
    const r = Math.sqrt(((slot % 36) + 0.5) / 36) * (R - 0.3)
    out[i].rest = [Math.cos(a) * r, 0.15 + Math.floor(slot / 36) * 0.13, Math.sin(a) * r]
  })
  return out
})()

const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function Beads({ pH }: { pH: number }) {
  const mesh = useRef<InstancedMesh>(null)
  const state = useRef(ALL.map((b) => [...b.drift]))
  const [o, c] = useMemo(() => [new Object3D(), new Color()], [])
  useFrame(({ clock }, dt) => {
    const m = mesh.current
    if (!m) return
    const t = clock.elapsedTime
    ALL.forEach((b, i) => {
      const down = b.rank < settled(b.metal, pH) / 100
      const jig = down || still() ? 0 : 0.035
      const goal = down ? b.rest : b.drift
      const s = state.current[i]
      for (let a = 0; a < 3; a++) s[a] = MathUtils.damp(s[a], goal[a] + Math.sin(t * (0.9 + a * 0.3) + i * (a + 1)) * jig, 3, dt)
      o.position.set(s[0], s[1], s[2])
      o.scale.setScalar(0.07)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
      m.setColorAt(i, c.set(COLOUR[b.metal]))
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })
  return (
    <>
      <instancedMesh ref={mesh} args={[undefined, undefined, ALL.length]} frustumCulled={false}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshPhysicalMaterial roughness={0.45} clearcoat={0.2} envMapIntensity={0.55} />
      </instancedMesh>
    </>
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

function Label({ at, children }: { at: [number, number, number]; children: string }) {
  return (
    <Html position={at} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
      <span className="pilot-tag">{children}</span>
    </Html>
  )
}

function Scene({ pH }: { pH: number }) {
  // Labels mount a frame late: drei's Html needs the canvas attached first.
  const [ready, setReady] = useState(false)
  // Narrow panels: zoom out and slide the scene left so the labels fit beside the beaker.
  const width = useThree((t) => t.size.width)
  const zoom = Math.min(118, width * 0.235)
  const k = width < 420 ? 0.45 : 0 // shift along the camera's right-hand axis
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <>
      <OrthographicCamera key={k} makeDefault position={[6 + k, 4.6, 6 - k]} zoom={zoom} onUpdate={(c) => c.lookAt(k, 0.8, -k)} />
      {/* Studio lighting built in the scene, so nothing is downloaded */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={4} position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[8, 8, 1]} />
        <Lightformer form="rect" intensity={2.5} position={[-6, 2, 2]} rotation={[0, Math.PI / 2, 0]} scale={[6, 4, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[5, 1.5, -4]} rotation={[0, -Math.PI / 3, 0]} scale={[5, 3, 1]} color="#9bb8ff" />
      </Environment>
      <directionalLight position={[3, 6, 2]} intensity={1.2} />
      {/* Slab */}
      <mesh position={[0, -0.12, 0]}>
        <boxGeometry args={[3, 0.24, 3]} />
        <meshStandardMaterial color="#2b3a34" roughness={0.7} />
      </mesh>
      <ContactShadows position={[0, 0.005, 0]} scale={4} blur={2.4} opacity={0.55} frames={1} />
      <Beaker />
      <Beads pH={pH} />
      {ready && <Label at={[R + 0.1, 0.16, 0]}>Settled out: sludge</Label>}
      {ready && <Label at={[R + 0.1, 1.05, 0]}>Still dissolved</Label>}
    </>
  )
}

const W = 320
const H = 190
const x = (pH: number) => 34 + ((pH - PH_MIN) / (PH_MAX - PH_MIN)) * (W - 44)
const y = (pct: number) => 12 + (pct / 100) * (H - 40)

/** % of each metal still dissolved against pH, with a marker at the reader's pH. */
function Chart({ pH }: { pH: number }) {
  const xs = Array.from({ length: 91 }, (_, i) => PH_MIN + (i / 90) * (PH_MAX - PH_MIN))
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="pilot-chart" role="img" aria-label="Share of each metal still dissolved, against how acidic the solution is">
      {[0, 50, 100].map((p) => (
        <g key={p}>
          <line x1={34} x2={W - 10} y1={y(100 - p)} y2={y(100 - p)} className="grid" />
          <text x={28} y={y(100 - p) + 3} textAnchor="end">{p}%</text>
        </g>
      ))}
      {[1, 2, 3, 4, 5].map((p) => (
        <text key={p} x={x(p)} y={H - 12} textAnchor="middle">{p}</text>
      ))}
      <text x={34} y={H - 1}>more acidic</text>
      <text x={W - 10} y={H - 1} textAnchor="end">less acidic (pH)</text>
      {METALS.map((m) => (
        <polyline key={m} fill="none" stroke={COLOUR[m]} strokeWidth={1.6} strokeLinejoin="round" points={xs.map((p) => `${x(p)},${y(settled(m, p))}`).join(' ')} />
      ))}
      <line x1={x(pH)} x2={x(pH)} y1={8} y2={H - 26} className="cursor" />
      {METALS.map((m) => (
        <circle key={m} cx={x(pH)} cy={y(settled(m, pH))} r={3.5} fill={COLOUR[m]} stroke="#0f1512" />
      ))}
    </svg>
  )
}

export function PilotA() {
  const [pH, setPH] = useState(1)
  const [equations, setEquations] = useState(false)
  const impurities = (settled('iron', pH) + settled('aluminium', pH)) / 2
  return (
    <figure className="pilot">
      <div className="pilot-stage">
        <div className="pilot-view" role="img" aria-label={`A beaker of battery leach solution at pH ${pH.toFixed(1)}`}>
          <Canvas dpr={[1, 2]} gl={{ antialias: true }} flat aria-hidden>
            <Scene pH={pH} />
          </Canvas>
        </div>
        <div className="pilot-side">
          <Chart pH={pH} />
          <ul className="pilot-key">
            {METALS.map((m) => (
              <li key={m}>
                <i style={{ background: COLOUR[m] }} />
                {NAME[m]} <b>{Math.round(100 - settled(m, pH))}%</b> dissolved
              </li>
            ))}
          </ul>
          <dl className="pilot-readout">
            <div>
              <dt>Impurities removed</dt>
              <dd>{Math.round(impurities)}%</dd>
            </div>
            <div>
              <dt>Nickel lost with them</dt>
              <dd>{Math.round(settled('nickel', pH))}%</dd>
            </div>
            <div>
              <dt>Cobalt lost with them</dt>
              <dd>{Math.round(settled('cobalt', pH))}%</dd>
            </div>
          </dl>
          <label className="pilot-toggle">
            <input type="checkbox" checked={equations} onChange={(e) => setEquations(e.target.checked)} /> Show the equations
          </label>
          {equations && (
            <ul className="pilot-eq">
              <li>Fe³⁺ + 3 OH⁻ → Fe(OH)₃ (solid)</li>
              <li>Al³⁺ + 3 OH⁻ → Al(OH)₃ (solid)</li>
            </ul>
          )}
        </div>
      </div>
      <label className="pilot-slider">
        <span>
          more acidic <b>pH {pH.toFixed(1)}</b> less acidic
        </span>
        <input type="range" min={PH_MIN} max={PH_MAX} step={0.05} value={pH} onChange={(e) => setPH(Number(e.target.value))} />
      </label>
    </figure>
  )
}
