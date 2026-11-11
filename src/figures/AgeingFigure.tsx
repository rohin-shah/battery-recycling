import { MathUtils } from 'three'
import { ENCODING } from './encoding'
import type { Vec } from './parts'
import { Tag } from './Tag'
import { within } from './transition'

/**
 * Why a cell holds less charge as it ages (Birkl et al. 2017): lithium gets trapped in a film that grows on the graphite,
 * and particles crack and lose contact. A cylindrical cell, with a magnified slice through it. The scrubber is time:
 * dragging it charges and discharges the cell (lithium shuttles across) while it ages. How much each mechanism
 * contributes is illustrative; the end point, about 80% of the original charge, is when cars usually retire a battery.
 */

export const AGEING_STEPS = ['New', 'A few years', 'Worn (about 80%)']
const IONS = 30
/** Share of the lithium that ends up trapped by the end. Illustrative: the capacity loss isn't split by mechanism. */
const TRAPPED = 0.2
const CYCLES_PER_STEP = 4

const hash = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453
  return x - Math.floor(x)
}

const ANODE = { x0: -1.35, x1: -0.35 }
const CATHODE = { x0: 0.35, x1: 1.35 }

/** Age 0 → 1 across the whole scrubber. */
export const ageAt = (p: number) => MathUtils.clamp(p / (AGEING_STEPS.length - 1), 0, 1)
export const capacityAt = (p: number) => 1 - TRAPPED * ageAt(p)

/** Electrode particles: graphite on the left, cathode on the right. A few crack as the cell ages. */
function Particles({ x0, x1, color, seed, age }: { x0: number; x1: number; color: string; seed: number; age: number }) {
  return (
    <>
      {Array.from({ length: 28 }, (_, i) => {
        const at: Vec = [MathUtils.lerp(x0 + 0.12, x1 - 0.12, hash(i, seed)), MathUtils.lerp(-0.7, 0.7, hash(i, seed + 1)), MathUtils.lerp(-0.2, 0.2, hash(i, seed + 2))]
        const cracks = i % 7 === 3
        const gap = cracks ? within(age, 0.3, 1) * 0.08 : 0
        return (
          <group key={i} position={at}>
            {[-1, 1].map((side) => (
              <mesh key={side} position={[0, side * gap, 0]} rotation={[0, 0, side === 1 ? 0 : Math.PI]}>
                <sphereGeometry args={[0.09, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color={color} roughness={0.8} side={2} />
              </mesh>
            ))}
          </group>
        )
      })}
    </>
  )
}

export function AgeingFigure({ progress }: { progress: number }) {
  const age = ageAt(progress)
  // Charging moves lithium into the graphite, discharging back to the cathode; the scrubber runs several cycles per step.
  const charge = (1 - Math.cos(progress * CYCLES_PER_STEP * Math.PI * 2)) / 2
  const film = 0.03 + 0.14 * age
  return (
    <group position={[0.5, -0.1, 0]} scale={0.8}>
      {/* The whole cell, shown much bigger than life, with lines to the magnified slice */}
      <group position={[-2.3, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.28, 0.28, 1.5, 32]} />
          <meshStandardMaterial color="#6f7a86" metalness={0.5} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.78, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.06, 16]} />
          <meshStandardMaterial color={ENCODING.steel} metalness={0.6} />
        </mesh>
        <mesh position={[0.29, 0, 0]}>
          <boxGeometry args={[0.02, 0.3, 0.2]} />
          <meshStandardMaterial color={ENCODING.heat} />
        </mesh>
      </group>
      {[0.15, -0.15].map((y) => (
        <mesh key={y} position={[-1.8, y * 4, 0]} rotation={[0, 0, Math.atan2(y * 4 - y, 0.9)]}>
          <boxGeometry args={[1.0, 0.008, 0.008]} />
          <meshStandardMaterial color="#9aa0a6" />
        </mesh>
      ))}
      {/* Anode (graphite on copper), separator, cathode (on aluminium) */}
      <mesh position={[ANODE.x0 - 0.04, 0, 0]}>
        <boxGeometry args={[0.04, 1.7, 0.5]} />
        <meshStandardMaterial color={ENCODING.copper} metalness={0.6} roughness={0.35} />
      </mesh>
      <Particles x0={ANODE.x0} x1={ANODE.x1} color={ENCODING.graphite} seed={1} age={age} />
      <mesh position={[ANODE.x1 + film / 2, 0, 0]}>
        <boxGeometry args={[film, 1.6, 0.48]} />
        <meshStandardMaterial color="#a3825a" transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.06, 1.7, 0.5]} />
        <meshStandardMaterial color={ENCODING.plastic} transparent opacity={0.6} depthWrite={false} />
      </mesh>
      <Particles x0={CATHODE.x0} x1={CATHODE.x1} color="#3b4a5c" seed={5} age={age} />
      <mesh position={[CATHODE.x1 + 0.04, 0, 0]}>
        <boxGeometry args={[0.04, 1.7, 0.5]} />
        <meshStandardMaterial color={ENCODING.aluminium} metalness={0.6} roughness={0.35} />
      </mesh>
      {/* Lithium ions: shuttle with charge and discharge; some get stuck in the film as the cell ages */}
      {Array.from({ length: IONS }, (_, i) => {
        const y = MathUtils.lerp(-0.7, 0.7, hash(i, 9))
        const z = MathUtils.lerp(-0.18, 0.18, hash(i, 10))
        const home = MathUtils.lerp(CATHODE.x0 + 0.1, CATHODE.x1 - 0.1, hash(i, 11))
        const away = MathUtils.lerp(ANODE.x0 + 0.1, ANODE.x1 - 0.1, hash(i, 12))
        const x = MathUtils.lerp(home, away, charge)
        // The first fifth of the ions, each at its own age, end up trapped in the film.
        const trapAt = i < IONS * TRAPPED ? 0.1 + (i / (IONS * TRAPPED)) * 0.85 : 2
        const stuck = within(age, trapAt, trapAt + 0.05)
        const pos: Vec = [MathUtils.lerp(x, ANODE.x1 + film * 0.5, stuck), y, z]
        return (
          <mesh key={i} position={pos}>
            <sphereGeometry args={[0.07, 12, 8]} />
            <meshStandardMaterial color={stuck > 0.5 ? '#8a8f7a' : '#f2e9a0'} emissive="#b8a84a" emissiveIntensity={stuck > 0.5 ? 0 : 0.4} />
          </mesh>
        )
      })}
      <Tag at={[-2.3, 0.95, 0]}>Cylindrical cell (enlarged)</Tag>
      <Tag at={[-0.85, 0.95, 0]}>Graphite (anode)</Tag>
      <Tag at={[0.85, 0.95, 0]}>Cathode</Tag>
      <Tag at={[0, -1.0, 0]}>Separator</Tag>
      <Tag at={[-0.3, 0.6, 0.25]}>Film that traps lithium</Tag>
      <Tag at={[0.6, -0.55, 0.25]}>Lithium</Tag>
    </group>
  )
}
