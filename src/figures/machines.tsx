import type { ReactNode } from 'react'
import { ENCODING } from './encoding'
import { brushedSteel, machinePanel } from './textures'

/**
 * Process machines for the pretreatment figure (Blömeke et al. 2022, Figs 4–6), in metres with the floor at y = 0.
 * Sizes are typical for industrial plant and illustrative only. Fronts are cut away so the inside shows.
 * Everything is a function of time from the scrubber: `run` is how far through its working step a machine is (moving
 * parts turn with it, so scrubbing back turns them back) and `heat` (0–1) is its violet glow.
 */

const Panel = ({ size, position, heat = 0 }: { size: [number, number, number]; position: [number, number, number]; heat?: number }) => (
  <mesh position={position}>
    <boxGeometry args={size} />
    <meshStandardMaterial map={machinePanel()} emissive={ENCODING.heat} emissiveIntensity={heat * 1.8} roughness={0.6} />
  </mesh>
)

const Steel = ({ children, ...p }: { children: ReactNode; position?: [number, number, number]; rotation?: [number, number, number] }) => (
  <mesh {...p}>
    {children}
    <meshStandardMaterial map={brushedSteel()} metalness={0.5} roughness={0.4} />
  </mesh>
)

/** An open-fronted box: back, sides and floor, so the inside shows. */
function Cutaway({ w, h, d, heat = 0 }: { w: number; h: number; d: number; heat?: number }) {
  const t = 0.1
  return (
    <group>
      <Panel size={[w, h, t]} position={[0, h / 2, -d / 2]} heat={heat} />
      <Panel size={[t, h, d]} position={[-w / 2, h / 2, 0]} heat={heat} />
      <Panel size={[t, h, d]} position={[w / 2, h / 2, 0]} heat={heat} />
      <Panel size={[w, t, d]} position={[0, t / 2, 0]} heat={heat} />
    </group>
  )
}

/** Furnace, 2.2 m wide and 2.5 m tall. */
export const Furnace = ({ heat }: { heat: number }) => <Cutaway w={2.2} h={2.5} d={2.2} heat={heat} />

/** Dust filter on legs with a stack; gases and dust collect above the stack. */
export function BagFilter() {
  return (
    <group>
      <Steel position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 2, 24]} />
      </Steel>
      <Steel position={[0, 0.95, 0]}>
        <coneGeometry args={[0.55, 0.5, 24]} />
      </Steel>
      {[-0.4, 0.4].map((x) => (
        <Steel key={x} position={[x, 0.6, 0]}>
          <boxGeometry args={[0.08, 1.2, 0.08]} />
        </Steel>
      ))}
      <Steel position={[0.7, 2.5, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 5, 12]} />
      </Steel>
    </group>
  )
}

/** Shredder: a 2 m housing with a hopper over two rollers that turn towards each other as the shredding step plays. */
export function Shredder({ run, nitrogen = false }: { run: number; nitrogen?: boolean }) {
  return (
    <group>
      <Cutaway w={2} h={1.4} d={1.6} />
      <mesh position={[0, 1.75, 0]} rotation={[0, Math.PI / 4, 0]}>
        <cylinderGeometry args={[1.2, 0.7, 0.7, 4, 1, true]} />
        <meshStandardMaterial map={brushedSteel()} metalness={0.4} roughness={0.45} side={2} />
      </mesh>
      {[-1, 1].map((dir) => (
        <mesh key={dir} position={[dir * 0.275, 1.2, 0]} rotation={[Math.PI / 2, run * 25 * dir, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 1.4, 8]} />
          <meshStandardMaterial color={ENCODING.steel} metalness={0.6} roughness={0.35} flatShading />
        </mesh>
      ))}
      {nitrogen && (
        <mesh position={[0, 1.3, 0]}>
          <sphereGeometry args={[1.5, 24, 16]} />
          <meshStandardMaterial color={ENCODING.nitrogen} transparent opacity={0.15} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

/** A drum on two supports, its axis along x, turning as its step plays: rotary dryer or kiln (glows when hot) or magnetic drum. */
export function Drum({ run, heat = 0, length, radius, height, color }: { run: number; heat?: number; length: number; radius: number; height: number; color?: string }) {
  return (
    <group>
      {[-length / 2 + 0.3, length / 2 - 0.3].map((x) => (
        <Steel key={x} position={[x, (height - radius) / 2, 0]}>
          <boxGeometry args={[0.2, height - radius, radius * 1.6]} />
        </Steel>
      ))}
      <group position={[0, height, 0]} rotation={[run * 8, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[radius, radius, length, 28, 1, true]} />
          <meshStandardMaterial map={color ? undefined : brushedSteel()} color={color ?? '#ffffff'} metalness={0.4} roughness={0.45} emissive={ENCODING.heat} emissiveIntensity={heat * 1.6} transparent opacity={0.55} side={2} depthWrite={false} />
        </mesh>
        {[-length / 3, length / 3].map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[radius + 0.01, 0.04, 6, 24]} />
            <meshStandardMaterial color="#3a3f44" />
          </mesh>
        ))}
        <mesh position={[0, radius, 0]}>
          <boxGeometry args={[length * 0.9, 0.04, 0.08]} />
          <meshStandardMaterial color="#3a3f44" />
        </mesh>
      </group>
    </group>
  )
}

/** Condenser column with a 200-litre drum (0.58 × 0.88 m) beside it that the electrolyte collects in. */
export function Condenser() {
  return (
    <group>
      <Steel position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 2.5, 20]} />
      </Steel>
      <mesh position={[0.8, 0.44, 0]}>
        <cylinderGeometry args={[0.29, 0.29, 0.88, 24, 1, true]} />
        <meshStandardMaterial color={ENCODING.steel} transparent opacity={0.35} side={2} depthWrite={false} />
      </mesh>
    </group>
  )
}

/** Vibrating sieve: a 2 m × 1.2 m mesh tray at 1 m that shakes as its step plays. */
export function Sieve({ run }: { run: number }) {
  const shaking = run > 0 && run < 1
  return (
    <group>
      <group position={[shaking ? Math.sin(run * 160) * 0.03 : 0, 1, 0]} rotation={[0, 0, -0.1]}>
        <mesh>
          <boxGeometry args={[2, 0.06, 1.2, 20, 1, 12]} />
          <meshStandardMaterial color={ENCODING.steel} wireframe />
        </mesh>
        <Steel position={[0, 0.08, -0.6]}>
          <boxGeometry args={[2, 0.18, 0.05]} />
        </Steel>
      </group>
      {[-0.9, 0.9].flatMap((x) =>
        [-0.5, 0.5].map((z) => (
          <Steel key={`${x},${z}`} position={[x, 0.5, z]}>
            <boxGeometry args={[0.06, 1, 0.06]} />
          </Steel>
        )),
      )}
    </group>
  )
}

/** A low pallet, 3.2 × 0.9 m, that the 32 modules arrive on. */
export function Pallet() {
  return (
    <mesh position={[0, 0.03, 0]}>
      <boxGeometry args={[3.2, 0.06, 0.9]} />
      <meshStandardMaterial color="#b89a6a" roughness={0.9} />
    </mesh>
  )
}
