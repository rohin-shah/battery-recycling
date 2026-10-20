import { ENCODING } from './encoding'
import { Pile } from './parts'
import { moduleLabel, pouchFoil } from './textures'

/** The material being processed, in metres, floor at y = 0. Module and cell sizes are typical, not from a specific pack. */

/** One module, 35 × 15 × 11 cm, labelled, with its two terminals. */
export function RealModule() {
  return (
    <group>
      <mesh position={[0, 0.055, 0]}>
        <boxGeometry args={[0.35, 0.11, 0.15]} />
        <meshStandardMaterial map={moduleLabel()} roughness={0.6} />
      </mesh>
      {[
        [-0.13, '#b3261e'],
        [0.13, '#1d1d1b'],
      ].map(([x, c]) => (
        <mesh key={c as string} position={[x as number, 0.125, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.03, 10]} />
          <meshStandardMaterial color={c as string} />
        </mesh>
      ))}
    </group>
  )
}

/** Eight modules in two layers, as they come off a pack. */
export function Modules() {
  return (
    <group>
      {Array.from({ length: 8 }, (_, i) => (
        <group key={i} position={[(i % 2) * 0.37 - 0.185, Math.floor(i / 4) * 0.115, (Math.floor(i / 2) % 2) * 0.17 - 0.085]}>
          <RealModule />
        </group>
      ))}
    </group>
  )
}

/** One pouch cell, 30 × 10 cm and 12 mm thick, with copper and aluminium tabs. */
export function PouchCell() {
  return (
    <group>
      <mesh position={[0, 0.006, 0]}>
        <boxGeometry args={[0.3, 0.012, 0.1]} />
        <meshStandardMaterial map={pouchFoil()} metalness={0.3} roughness={0.35} />
      </mesh>
      {[
        [-0.03, ENCODING.copper],
        [0.03, ENCODING.aluminium],
      ].map(([z, c]) => (
        <mesh key={c as string} position={[0.165, 0.006, z as number]}>
          <boxGeometry args={[0.03, 0.002, 0.025]} />
          <meshStandardMaterial color={c as string} metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

/** A short stack of pouch cells. */
export function Cells() {
  return (
    <group>
      {Array.from({ length: 12 }, (_, i) => (
        <group key={i} position={[(i % 2) * 0.32 - 0.16, Math.floor(i / 4) * 0.013, (Math.floor(i / 2) % 2) * 0.12 - 0.06]}>
          <PouchCell />
        </group>
      ))}
    </group>
  )
}

/** Shredded pieces: coated foil, casing and separator flakes. `fine` after the second shredder. */
export function Shreds({ fine = false }: { fine?: boolean }) {
  const r = fine ? 0.35 : 0.45
  return (
    <group>
      <Pile color={ENCODING.blackMass} radius={r} count={220} seed={21} />
      <Pile color={ENCODING.copper} radius={r} count={60} seed={22} />
      <Pile color={ENCODING.aluminium} radius={r} count={60} seed={23} />
      {!fine && <Pile color={ENCODING.steel} radius={r} count={40} seed={24} />}
    </group>
  )
}

/** Copper and aluminium foil left on the sieve. */
export function Foils() {
  return (
    <group>
      <Pile color={ENCODING.copper} radius={0.35} count={80} seed={31} />
      <Pile color={ENCODING.aluminium} radius={0.35} count={80} seed={32} />
      <Pile color={ENCODING.plastic} radius={0.35} count={40} seed={33} />
    </group>
  )
}

export function BlackMassHeap() {
  return <Pile color={ENCODING.blackMass} radius={0.45} count={300} seed={35} />
}
