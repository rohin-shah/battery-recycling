import { useFrame } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import { MathUtils, type Group, type Mesh, type MeshStandardMaterial } from 'three'
import { ENCODING } from './encoding'

/**
 * Simple, recognisable process machines for the pretreatment figure (Blömeke et al. 2022, Figs 4–6).
 * Violet glow = heat; moving parts turn only while their step is active.
 */

const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Damps a material's violet glow towards `level`. */
function useGlow(level: number) {
  const mat = useRef<MeshStandardMaterial>(null)
  useFrame((_, dt) => {
    if (mat.current) mat.current.emissiveIntensity = MathUtils.damp(mat.current.emissiveIntensity, level, 3, dt)
  })
  return mat
}

/** Spins a part about one axis while active. */
function useTurn(ref: RefObject<Group | Mesh | null>, active: boolean, axis: 'x' | 'y' | 'z', speed = 2) {
  useFrame((_, dt) => {
    if (ref.current && active && !still()) ref.current.rotation[axis] += dt * speed
  })
}

function Body({ size, glow = 0, opacity = 1, color = ENCODING.machine }: { size: [number, number, number]; glow?: number; opacity?: number; color?: string }) {
  const mat = useGlow(glow)
  return (
    <mesh>
      <boxGeometry args={size} />
      <meshStandardMaterial ref={mat} color={color} emissive={ENCODING.heat} emissiveIntensity={0} roughness={0.5} transparent={opacity < 1} opacity={opacity} depthWrite={opacity === 1} />
    </mesh>
  )
}

/** Furnace. Three stacked zones (pre-heating, decomposition, smelting) unless `single`; the melt shows as alloy under slag. */
export function Furnace({ zones, melt, single = false }: { zones: [number, number, number]; melt: boolean; single?: boolean }) {
  const heights = single ? [0.9] : [0.32, 0.32, 0.36]
  let y = 0.55
  return (
    <group>
      {heights.map((h, i) => {
        y -= h
        const at = y + h / 2
        return (
          <group key={i} position={[0, at, 0]}>
            <Body size={[0.8, h - 0.03, 0.8]} glow={(single ? zones[2] : zones[i]) * 1.5} opacity={0.8} />
          </group>
        )
      })}
      {melt && (
        <>
          <mesh position={[0, -0.28, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.1, 24]} />
            <meshStandardMaterial color={ENCODING.slag} />
          </mesh>
          <mesh position={[0, -0.38, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.1, 24]} />
            <meshStandardMaterial color={ENCODING.steel} metalness={0.6} roughness={0.3} />
          </mesh>
        </>
      )}
    </group>
  )
}

/** Rising puffs of off-gas from a stack. */
function OffGas({ active }: { active: boolean }) {
  const g = useRef<Group>(null)
  useFrame(({ clock }) => {
    g.current?.children.forEach((c, i) => {
      const t = (clock.elapsedTime * 0.4 + i / 3) % 1
      c.position.y = t * 0.6
      c.scale.setScalar(active && !still() ? 0.06 + t * 0.08 : 0)
    })
  })
  return (
    <group ref={g} position={[0, 0.55, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color={ENCODING.dust} transparent opacity={0.35} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

/** Bag filter with a stack: catches flue dust, sends cleaned off-gas up. */
export function BagFilter({ active }: { active: boolean }) {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.6, 20]} />
        <meshStandardMaterial color={ENCODING.machine} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.4, 0]}>
        <coneGeometry args={[0.22, 0.2, 20]} />
        <meshStandardMaterial color={ENCODING.machine} roughness={0.5} />
      </mesh>
      <mesh position={[0.15, 0.45, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.5, 10]} />
        <meshStandardMaterial color={ENCODING.steel} />
      </mesh>
      <group position={[0.15, 0.15, 0]}>
        <OffGas active={active} />
      </group>
    </group>
  )
}

/** Shredder: a hopper over two counter-rotating rollers; optional nitrogen haze. */
export function Shredder({ active, nitrogen = false }: { active: boolean; nitrogen?: boolean }) {
  const a = useRef<Mesh>(null)
  const b = useRef<Mesh>(null)
  useTurn(a, active, 'z', 4)
  useTurn(b, active, 'z', -4)
  return (
    <group>
      <Body size={[0.7, 0.5, 0.6]} />
      {[a, b].map((r, i) => (
        <mesh key={i} ref={r} position={[(i - 0.5) * 0.28, 0.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.55, 8]} />
          <meshStandardMaterial color={ENCODING.steel} metalness={0.5} roughness={0.35} flatShading />
        </mesh>
      ))}
      {nitrogen && (
        <mesh>
          <sphereGeometry args={[0.65, 24, 16]} />
          <meshStandardMaterial color={ENCODING.nitrogen} transparent opacity={active ? 0.25 : 0.1} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

/** A horizontal rotating drum: rotary dryer or kiln (hot), magnetic drum, or mill. */
export function Drum({ active, hot = false, color = ENCODING.machine, length = 0.9, radius = 0.25 }: { active: boolean; hot?: boolean; color?: string; length?: number; radius?: number }) {
  const g = useRef<Group>(null)
  const mat = useGlow(hot && active ? 1.4 : 0)
  useTurn(g, active, 'x', 1.5)
  return (
    <group ref={g} rotation={[0, 0, Math.PI / 2]}>
      <mesh>
        <cylinderGeometry args={[radius, radius, length, 24]} />
        <meshStandardMaterial ref={mat} color={color} emissive={ENCODING.heat} emissiveIntensity={0} roughness={0.45} />
      </mesh>
      {/* A stripe so the turning is visible */}
      <mesh position={[0, 0, radius]}>
        <boxGeometry args={[0.04, length, 0.02]} />
        <meshStandardMaterial color={ENCODING.steel} />
      </mesh>
    </group>
  )
}

/** Condenser with a drum collecting liquid electrolyte. */
export function Condenser({ full }: { full: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.6, 16]} />
        <meshStandardMaterial color={ENCODING.machine} />
      </mesh>
      <mesh position={[0.3, -0.25, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.3, 20]} />
        <meshStandardMaterial color={ENCODING.electrolyte} transparent opacity={full ? 0.9 : 0.2} />
      </mesh>
    </group>
  )
}

/** Zigzag air sifter: a tall column of alternating baffles. */
export function Zigzag({ active }: { active: boolean }) {
  const mat = useRef<MeshStandardMaterial>(null)
  useFrame(({ clock }) => {
    if (mat.current) mat.current.opacity = active && !still() ? 0.25 + Math.sin(clock.elapsedTime * 6) * 0.1 : 0.1
  })
  return (
    <group>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[(i % 2 ? 0.08 : -0.08), -0.4 + i * 0.2, 0]} rotation={[0, 0, i % 2 ? 0.5 : -0.5]}>
          <boxGeometry args={[0.32, 0.2, 0.3]} />
          <meshStandardMaterial color={ENCODING.machine} roughness={0.5} />
        </mesh>
      ))}
      {/* The rising air stream */}
      <mesh position={[0, 0.1, 0.2]}>
        <cylinderGeometry args={[0.05, 0.05, 1.1, 8]} />
        <meshStandardMaterial ref={mat} color={ENCODING.nitrogen} transparent opacity={0.1} depthWrite={false} />
      </mesh>
    </group>
  )
}

/** Vibrating sieve tray on legs. */
export function Sieve({ active }: { active: boolean }) {
  const tray = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (tray.current) tray.current.position.x = active && !still() ? Math.sin(clock.elapsedTime * 30) * 0.015 : 0
  })
  return (
    <group>
      <group ref={tray} position={[0, 0.05, 0]} rotation={[0, 0, -0.12]}>
        <mesh>
          <boxGeometry args={[0.9, 0.04, 0.6]} />
          <meshStandardMaterial color={ENCODING.machine} wireframe />
        </mesh>
        <mesh>
          <boxGeometry args={[0.9, 0.03, 0.6]} />
          <meshStandardMaterial color={ENCODING.machine} transparent opacity={0.3} />
        </mesh>
      </group>
      {[-0.4, 0.4].map((x) => (
        <mesh key={x} position={[x, -0.25, 0]}>
          <boxGeometry args={[0.04, 0.55, 0.04]} />
          <meshStandardMaterial color={ENCODING.steel} />
        </mesh>
      ))}
    </group>
  )
}

/** Workbench where modules are opened down to cells. */
export function Bench() {
  return (
    <group position={[0, -0.25, 0]}>
      <Body size={[1.0, 0.05, 0.7]} />
      {[-0.45, 0.45].map((x) => (
        <mesh key={x} position={[x, -0.2, 0]}>
          <boxGeometry args={[0.05, 0.4, 0.6]} />
          <meshStandardMaterial color={ENCODING.steel} />
        </mesh>
      ))}
    </group>
  )
}
