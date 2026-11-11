import { MathUtils } from 'three'
import { ENCODING } from './encoding'
import { Tag } from './Tag'

/**
 * The waste hierarchy (Waste (England and Wales) Regulations 2011, reg. 12) as a funnel, best option at the top. A used
 * cell falls in and bounces down past "prevention" (too late: it already exists) to land on "preparing for re-use".
 * Driven by scroll: `progress` 0 → 1 as the figure moves up the screen. The bounce is scripted, so scrolling back runs it
 * backwards; the cell is there from the start, waiting above the funnel.
 */

export const LEVELS = ['Prevention', 'Preparing for re-use', 'Recycling', 'Other recovery', 'Disposal (banned for EV batteries)']
const TOP = 1.4
const BAND = 0.5
/** Radius of the funnel wall at height y: widest at the top, narrowing towards disposal. */
const radiusAt = (y: number) => MathUtils.lerp(0.35, 1.5, (y - (TOP - BAND * LEVELS.length)) / (BAND * LEVELS.length))
/** Where the cell comes to rest: on top of the second band. */
const REST_Y = TOP - BAND * 1.5

/** The cell's path: falls from above, zigzagging between the walls (each bounce smaller), then settles. */
function cellAt(p: number): [number, number, number] {
  const t = MathUtils.clamp(p, 0, 1)
  const y = MathUtils.lerp(TOP + 1.0, REST_Y, MathUtils.smootherstep(t, 0, 0.9))
  const swing = Math.sin(t * Math.PI * 5) * (1 - t) * 0.9
  return [swing * radiusAt(Math.min(y, TOP)) * 0.75, y, 0]
}

export function FunnelFigure({ progress }: { progress: number }) {
  const [cx, cy] = cellAt(progress)
  const tilt = Math.cos(progress * Math.PI * 5) * (1 - progress) * 0.6
  return (
    <group position={[0, -0.35, 0]} scale={0.95}>
      {LEVELS.map((name, i) => {
        const yTop = TOP - i * BAND
        const yMid = yTop - BAND / 2
        const best = i === 1
        return (
          <group key={name}>
            <mesh position={[0, yMid, 0]}>
              <cylinderGeometry args={[radiusAt(yTop), radiusAt(yTop - BAND), BAND - 0.03, 40, 1, true]} />
              <meshStandardMaterial
                color={i === LEVELS.length - 1 ? '#b3261e' : best ? ENCODING.recovered : ENCODING.casing}
                transparent
                opacity={i === LEVELS.length - 1 ? 0.35 : 0.45}
                side={2}
                depthWrite={false}
              />
            </mesh>
            <Tag at={[radiusAt(yMid) + 0.05, yMid, 0]}>{name}</Tag>
          </group>
        )
      })}
      {/* The shelf the cell lands on: reuse comes before recycling */}
      <mesh position={[0, REST_Y - 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, radiusAt(REST_Y) * 0.6, 32]} />
        <meshStandardMaterial color={ENCODING.recovered} transparent opacity={0.5} side={2} />
      </mesh>
      <group position={[cx, cy, 0]} rotation={[0, 0, tilt]}>
        <mesh>
          <cylinderGeometry args={[0.09, 0.09, 0.26, 20]} />
          <meshStandardMaterial color="#6f7a86" metalness={0.5} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.03, 12]} />
          <meshStandardMaterial color={ENCODING.steel} metalness={0.6} />
        </mesh>
      </group>
    </group>
  )
}
