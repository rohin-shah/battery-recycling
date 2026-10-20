import { useFrame } from '@react-three/fiber'
import { useRef, type ReactNode, type RefObject } from 'react'
import { MathUtils, type Group, type Mesh, type MeshStandardMaterial } from 'three'
import { ENCODING } from './encoding'
import { brushedSteel, machinePanel } from './textures'

/**
 * Process machines for the pretreatment figure (Blömeke et al. 2022, Figs 4–6), in metres with the floor at y = 0.
 * Sizes are typical for industrial plant and illustrative only. Fronts are cut away so the inside can be seen.
 * Violet glow = heat; moving parts turn while their step is active.
 */

const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Damps a material's violet glow towards `level`. */
function useGlow(level: number) {
  const mat = useRef<MeshStandardMaterial>(null)
  useFrame((_, dt) => {
    if (mat.current) mat.current.emissiveIntensity = MathUtils.damp(mat.current.emissiveIntensity, level, 2.5, dt)
  })
  return mat
}

function useTurn(ref: RefObject<Group | Mesh | null>, active: boolean, axis: 'x' | 'y' | 'z', speed = 2) {
  useFrame((_, dt) => {
    if (ref.current && active && !still()) ref.current.rotation[axis] += dt * speed
  })
}

const Panel = ({ size, position, glow = 0 }: { size: [number, number, number]; position: [number, number, number]; glow?: number }) => {
  const mat = useGlow(glow)
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial ref={mat} map={machinePanel()} emissive={ENCODING.heat} emissiveIntensity={0} roughness={0.6} />
    </mesh>
  )
}

const Steel = ({ children, ...p }: { children: ReactNode; position?: [number, number, number]; rotation?: [number, number, number] }) => (
  <mesh {...p}>
    {children}
    <meshStandardMaterial map={brushedSteel()} metalness={0.5} roughness={0.4} />
  </mesh>
)

/** An open-fronted box: back, sides and floor, so the inside shows. */
function Cutaway({ w, h, d, y = 0, glow = 0 }: { w: number; h: number; d: number; y?: number; glow?: number }) {
  const t = 0.1
  return (
    <group position={[0, y, 0]}>
      <Panel size={[w, h, t]} position={[0, h / 2, -d / 2]} glow={glow} />
      <Panel size={[t, h, d]} position={[-w / 2, h / 2, 0]} glow={glow} />
      <Panel size={[t, h, d]} position={[w / 2, h / 2, 0]} glow={glow} />
      <Panel size={[w, t, d]} position={[0, t / 2, 0]} glow={glow} />
    </group>
  )
}

/** Furnace, 2.4 m wide. Three zones stacked (smelting 1.6 m, decomposition 1.2 m, pre-heating 1.2 m) unless `single`. */
export function Furnace({ zones, single = false }: { zones: [number, number, number]; single?: boolean }) {
  if (single) return <Cutaway w={2.2} h={2.5} d={2.2} glow={zones[2] * 2} />
  return (
    <group>
      <Cutaway w={2.4} h={1.6} d={2.4} glow={zones[2] * 2} />
      <Cutaway w={2.4} h={1.2} d={2.4} y={1.6} glow={zones[1] * 2} />
      <Cutaway w={2.4} h={1.2} d={2.4} y={2.8} glow={zones[0] * 2} />
    </group>
  )
}

/** The melt in the smelting zone: heavy alloy sinks under lighter slag. */
export function Melt({ width = 2.1 }: { width?: number }) {
  return (
    <group>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[width, 0.25, width]} />
        <meshStandardMaterial color={ENCODING.steel} metalness={0.7} roughness={0.3} emissive={ENCODING.heat} emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[width, 0.25, width]} />
        <meshStandardMaterial color={ENCODING.slag} roughness={0.8} emissive={ENCODING.heat} emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}

/** Puffs rising from a point while active. */
export function Puffs({ active, height = 1.5, size = 0.3 }: { active: boolean; height?: number; size?: number }) {
  const g = useRef<Group>(null)
  useFrame(({ clock }) => {
    g.current?.children.forEach((c, i) => {
      const t = (clock.elapsedTime * 0.35 + i / 4) % 1
      c.position.y = t * height
      c.scale.setScalar(active && !still() ? size * (0.4 + t) : 0)
    })
  })
  return (
    <group ref={g}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color={ENCODING.dust} transparent opacity={0.35} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

/** Bag filter on legs, 3.5 m tall, with a 6 m stack. */
export function BagFilter({ active }: { active: boolean }) {
  return (
    <group>
      <Steel position={[0, 2.4, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 2.2, 24]} />
      </Steel>
      <Steel position={[0, 1.0, 0]}>
        <coneGeometry args={[0.6, 0.6, 24]} />
      </Steel>
      {[-0.45, 0.45].map((x) => (
        <Steel key={x} position={[x, 0.65, 0]}>
          <boxGeometry args={[0.08, 1.3, 0.08]} />
        </Steel>
      ))}
      <Steel position={[0.8, 3.0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 6, 12]} />
      </Steel>
      <group position={[0.8, 6, 0]}>
        <Puffs active={active} />
      </group>
    </group>
  )
}

/** Shredder: a 2 m housing with a hopper over two counter-rotating rollers; optional nitrogen blanket. */
/** One shredder roller; the pair turn towards each other. */
function Roller({ x, active, speed }: { x: number; active: boolean; speed: number }) {
  const r = useRef<Mesh>(null)
  useTurn(r, active, 'z', speed)
  return (
    <mesh ref={r} position={[x, 1.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.25, 0.25, 1.4, 8]} />
      <meshStandardMaterial color={ENCODING.steel} metalness={0.6} roughness={0.35} flatShading />
    </mesh>
  )
}

export function Shredder({ active, nitrogen = false }: { active: boolean; nitrogen?: boolean }) {
  return (
    <group>
      <Cutaway w={2} h={1.4} d={1.6} />
      {/* Hopper */}
      <mesh position={[0, 1.75, 0]} rotation={[0, Math.PI / 4, 0]}>
        <cylinderGeometry args={[1.2, 0.7, 0.7, 4, 1, true]} />
        <meshStandardMaterial map={brushedSteel()} metalness={0.4} roughness={0.45} side={2} />
      </mesh>
      <Roller x={-0.275} active={active} speed={4} />
      <Roller x={0.275} active={active} speed={-4} />
      {nitrogen && (
        <mesh position={[0, 1.3, 0]}>
          <sphereGeometry args={[1.5, 24, 16]} />
          <meshStandardMaterial color={ENCODING.nitrogen} transparent opacity={active ? 0.22 : 0.08} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

/** A rotating drum on two supports, its axis along x: rotary dryer or kiln (hot), magnetic drum, or ball mill. */
export function Drum({ active, hot = false, length, radius, height, color }: { active: boolean; hot?: boolean; length: number; radius: number; height: number; color?: string }) {
  const g = useRef<Group>(null)
  const mat = useGlow(hot && active ? 1.6 : 0)
  useTurn(g, active, 'x', 1.2)
  return (
    <group>
      {[-length / 2 + 0.3, length / 2 - 0.3].map((x) => (
        <Steel key={x} position={[x, (height - radius) / 2, 0]}>
          <boxGeometry args={[0.2, height - radius, radius * 1.6]} />
        </Steel>
      ))}
      <group ref={g} position={[0, height, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[radius, radius, length, 28]} />
          <meshStandardMaterial ref={mat} map={color ? undefined : brushedSteel()} color={color ?? '#ffffff'} metalness={0.4} roughness={0.45} emissive={ENCODING.heat} emissiveIntensity={0} />
        </mesh>
        {/* Bands, so the turning shows */}
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

/** Condenser column, 2.5 m. */
export function Condenser() {
  return (
    <Steel position={[0, 1.25, 0]}>
      <cylinderGeometry args={[0.3, 0.3, 2.5, 20]} />
    </Steel>
  )
}

/** A 200-litre drum (0.58 m × 0.88 m) of recovered electrolyte. */
export function ElectrolyteDrum() {
  return (
    <mesh position={[0, 0.44, 0]}>
      <cylinderGeometry args={[0.29, 0.29, 0.88, 24]} />
      <meshStandardMaterial color={ENCODING.electrolyte} roughness={0.5} />
    </mesh>
  )
}

/** Zigzag air sifter: a 3.5 m column, cut away to show its baffles and the rising air. */
export function Zigzag({ active }: { active: boolean }) {
  const air = useRef<MeshStandardMaterial>(null)
  useFrame(({ clock }) => {
    if (air.current) air.current.opacity = active && !still() ? 0.3 + Math.sin(clock.elapsedTime * 6) * 0.1 : 0.08
  })
  return (
    <group>
      <Cutaway w={0.8} h={3.5} d={0.8} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} position={[i % 2 ? 0.12 : -0.12, 0.5 + i * 0.5, 0]} rotation={[0, 0, i % 2 ? 0.6 : -0.6]}>
          <boxGeometry args={[0.5, 0.05, 0.7]} />
          <meshStandardMaterial color={ENCODING.steel} />
        </mesh>
      ))}
      <mesh position={[0, 1.9, 0.1]}>
        <cylinderGeometry args={[0.12, 0.12, 3.2, 10]} />
        <meshStandardMaterial ref={air} color={ENCODING.nitrogen} transparent opacity={0.08} depthWrite={false} />
      </mesh>
    </group>
  )
}

/** Vibrating sieve: a 2 m × 1.2 m mesh tray at 1 m. */
export function Sieve({ active }: { active: boolean }) {
  const tray = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (tray.current) tray.current.position.x = active && !still() ? Math.sin(clock.elapsedTime * 30) * 0.02 : 0
  })
  return (
    <group>
      <group ref={tray} position={[0, 1, 0]} rotation={[0, 0, -0.1]}>
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

/** Workbench, 2 m × 0.9 m, 0.9 m high. */
export function Bench() {
  return (
    <group>
      <Steel position={[0, 0.88, 0]}>
        <boxGeometry args={[2, 0.05, 0.9]} />
      </Steel>
      {[-0.95, 0.95].flatMap((x) =>
        [-0.4, 0.4].map((z) => (
          <Steel key={`${x},${z}`} position={[x, 0.43, z]}>
            <boxGeometry args={[0.05, 0.86, 0.05]} />
          </Steel>
        )),
      )}
    </group>
  )
}
