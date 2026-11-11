import { CatmullRomCurve3, MathUtils, MeshStandardMaterial, Vector3 } from 'three'
import { ENCODING } from './encoding'
import type { Vec } from './parts'
import { Floor, Person, Phone } from './scale'
import { Tag } from './Tag'
import { brushedSteel, machinePanel, pouchFoil } from './textures'
import { within } from './transition'

/**
 * Chapter 2, laid out like a real Nissan Leaf pack (photos on Wikimedia Commons): pouch-cell modules in two flat stacks
 * at the front and a row standing on edge at the back, a junction box with relays, an orange high-voltage harness and
 * connectors, a sealed tray and a lid. Air-cooled, so no cooling plate. 32 modules, to match the rest of the page; sizes
 * in metres and illustrative. The scrubber is time; every part is there from the start and only moves.
 */

export const DISASSEMBLY_STEPS = ['Arrives', 'Discharged', 'Opened up', 'Inside a cell']

/** A Leaf-style pouch module: 30 × 22 cm and 3.5 cm thick. */
const MOD: Vec = [0.3, 0.035, 0.22]
type Placed = { inPack: Vec; standing: boolean; out: Vec }
const MODULES: Placed[] = [
  // Two flat stacks of 12 at the front
  ...Array.from({ length: 24 }, (_, i): Placed => ({ inPack: [i < 12 ? -0.36 : 0.36, 0.07 + (i % 12) * 0.037, 0.24], standing: false, out: [-1.2 + (i % 8) * 0.34, 0.02, 1.1 + Math.floor(i / 8) * 0.26] })),
  // Eight standing on edge at the back
  ...Array.from({ length: 8 }, (_, i): Placed => ({ inPack: [-0.42 + i * 0.12, 0.2, -0.33], standing: true, out: [-1.2 + i * 0.34, 0.02, 1.88] })),
]

const lerp3 = (a: Vec, b: Vec, k: number): Vec => [MathUtils.lerp(a[0], b[0], k), MathUtils.lerp(a[1], b[1], k), MathUtils.lerp(a[2], b[2], k)]
/** Lift, carry, set down: from a to b, rising `h` in the middle. */
const carry = (a: Vec, b: Vec, k: number, h = 0.5): Vec => {
  const p = lerp3(a, b, k)
  p[1] += Math.sin(k * Math.PI) * h
  return p
}

/** How far each stage has got, from the scrubber: 0 → 1 discharge, 1 → 2 open up, 2 → 3 open a cell. */
const phases = (p: number) => ({ discharge: MathUtils.clamp(p, 0, 1), open: MathUtils.clamp(p - 1, 0, 1), cell: MathUtils.clamp(p - 2, 0, 1) })

/** Live readouts for the caption, from the scrubber position. */
export const disassemblyReadout = (p: number) => {
  const { discharge, open } = phases(p)
  return { chargeLeft: 1 - within(discharge, 0.2, 0.9), removed: within(open, 0.15, 0.55) }
}

/** One material shared by all the modules, so their charge glow fades together. Only one such figure exists. */
let glowing: MeshStandardMaterial | undefined
const moduleMaterial = () => (glowing ??= new MeshStandardMaterial({ map: pouchFoil(), color: '#d7dccf', emissive: ENCODING.heat, emissiveIntensity: 0.9, roughness: 0.45, metalness: 0.2 }))

/** The layers of one pouch cell, top to bottom, fanned out above the pack when it's opened. Colours as everywhere else. */
const LAYERS: { name: string; color: string; coat?: string }[] = [
  { name: 'Pouch: aluminium–plastic film', color: '#c8ccc8' },
  { name: "Cathode (nickel, cobalt, manganese, lithium) on aluminium", color: ENCODING.aluminium, coat: '#3b4a5c' },
  { name: 'Plastic separator', color: ENCODING.plastic },
  { name: 'Graphite anode on copper foil', color: ENCODING.copper, coat: ENCODING.graphite },
  { name: 'Pouch', color: '#c8ccc8' },
]
const CELL_START: Vec = [0.36, 0.52, 0.24] // inside the top module of the right-hand stack
/** Where layer i ends up: standing upright side by side above the module rows, facing the viewer, shown 3.5× size. */
const fanned = (i: number): Vec => [-1.3 + i * 0.75, 1.5, 1.2]
const ENLARGE = 3.5

function Cable({ p }: { p: number }) {
  const { discharge, open } = phases(p)
  // The plug hangs on the station, is plugged in for the discharge, then unplugged before the pack is opened.
  const plugged = within(discharge, 0, 0.18) * (1 - within(open, 0, 0.12))
  const end = lerp3([-1.55, 0.95, -0.05], [-0.72, 0.06, 0.62], plugged)
  const curve = new CatmullRomCurve3([new Vector3(-1.75, 0.95, -0.25), new Vector3((end[0] - 1.75) / 2, 0.15, (end[2] - 0.25) / 2), new Vector3(...end)])
  const flowing = discharge > 0.18 && discharge < 0.95
  return (
    <mesh>
      <tubeGeometry args={[curve, 24, 0.018, 8, false]} />
      <meshStandardMaterial color={ENCODING.cable} emissive={ENCODING.heat} emissiveIntensity={flowing ? 0.8 : 0} roughness={0.5} />
    </mesh>
  )
}

function Scene({ p }: { p: number }) {
  const { open, cell } = phases(p)
  moduleMaterial().emissiveIntensity = 0.9 * disassemblyReadout(p).chargeLeft
  const lidK = within(open, 0, 0.3)
  const partsK = within(open, 0.15, 0.45)
  const cellK = within(cell, 0, 0.7)
  return (
    <group>
      <Floor width={10} />
      {/* Lower tray, with its orange seal */}
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[1.55, 0.06, 1.2]} />
        <meshStandardMaterial map={brushedSteel()} color="#9aa0a6" metalness={0.5} roughness={0.45} />
      </mesh>
      {[
        [0, -0.6, 1.55, 0.02],
        [0, 0.6, 1.55, 0.02],
        [-0.775, 0, 0.02, 1.2],
        [0.775, 0, 0.02, 1.2],
      ].map(([x, z, w, d]) => (
        <group key={`${x},${z}`}>
          <mesh position={[x, 0.12, z]}>
            <boxGeometry args={[w, 0.18, d]} />
            <meshStandardMaterial map={brushedSteel()} color="#9aa0a6" metalness={0.5} roughness={0.45} />
          </mesh>
          <mesh position={[x, 0.215, z]}>
            <boxGeometry args={[w + 0.01, 0.012, d + 0.01]} />
            <meshStandardMaterial color={ENCODING.cable} />
          </mesh>
        </group>
      ))}
      {/* Modules */}
      {MODULES.map((m, i) => {
        // Lifted out one after another
        const k = within(open, 0.45 + (i / MODULES.length) * 0.4, 0.55 + (i / MODULES.length) * 0.45)
        return (
          <mesh key={i} position={carry(m.inPack, m.out, k, 0.45)} rotation={[0, 0, m.standing ? (1 - k) * (Math.PI / 2) : 0]} material={moduleMaterial()}>
            <boxGeometry args={MOD} />
          </mesh>
        )
      })}
      {/* Junction box with relays, harness and connectors: lifted out together to the right */}
      <group position={carry([0, 0, 0], [1.75, -0.02, -0.35], partsK, 0.5)}>
        <mesh position={[0.62, 0.3, -0.33]}>
          <boxGeometry args={[0.18, 0.18, 0.3]} />
          <meshStandardMaterial map={machinePanel()} color="#cfd3cf" roughness={0.6} />
        </mesh>
        {[-0.08, 0.06].map((z) => (
          <mesh key={z} position={[0.62, 0.42, -0.33 + z]}>
            <boxGeometry args={[0.07, 0.06, 0.06]} />
            <meshStandardMaterial color="#c9a227" metalness={0.5} roughness={0.35} />
          </mesh>
        ))}
        {[-0.36, 0.36].map((x) => (
          <mesh key={x} position={[x, 0.55, 0.24]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.5, 8]} />
            <meshStandardMaterial color={ENCODING.cable} roughness={0.5} />
          </mesh>
        ))}
        <mesh position={[0.1, 0.42, -0.1]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.015, 0.015, 1.1, 8]} />
          <meshStandardMaterial color={ENCODING.cable} roughness={0.5} />
        </mesh>
        {[-0.2, 0.2].map((x) => (
          <mesh key={x} position={[x - 0.5, 0.12, 0.62]}>
            <boxGeometry args={[0.1, 0.08, 0.06]} />
            <meshStandardMaterial color={ENCODING.cable} roughness={0.5} />
          </mesh>
        ))}
      </group>
      {/* Lid: lifted off and set down on the left */}
      <group position={carry([0, 0.58, 0], [-1.9, 0.02, 0.5], lidK, 0.6)} rotation={[0, lidK * 0.4, 0]}>
        <mesh>
          <boxGeometry args={[1.6, 0.025, 1.25]} />
          <meshStandardMaterial color="#3c4146" roughness={0.6} metalness={0.3} transparent opacity={0.92} />
        </mesh>
        {[-0.4, 0, 0.4].map((z) => (
          <mesh key={z} position={[0, 0.02, z]}>
            <boxGeometry args={[1.5, 0.02, 0.06]} />
            <meshStandardMaterial color="#2f3337" />
          </mesh>
        ))}
      </group>
      {/* One cell, inside the top right-hand module until it's taken out and its layers fanned apart */}
      {LAYERS.map((l, i) => {
        const at = carry(CELL_START, fanned(i), cellK, 0.4)
        return (
          <group key={i} position={at} rotation={[cellK * (Math.PI / 2), 0, 0]} scale={1 + (ENLARGE - 1) * cellK}>
            <mesh>
              <boxGeometry args={[0.28, 0.006, 0.2]} />
              <meshStandardMaterial color={l.color} metalness={l.coat ? 0.6 : 0.1} roughness={0.4} />
            </mesh>
            {l.coat && (
              <mesh position={[0, 0.006, 0]}>
                <boxGeometry args={[0.26, 0.006, 0.18]} />
                <meshStandardMaterial color={l.coat} roughness={0.9} />
              </mesh>
            )}
          </group>
        )
      })}
      {/* Discharge station */}
      <group position={[-1.75, 0, -0.25]}>
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[0.45, 1.2, 0.4]} />
          <meshStandardMaterial map={machinePanel()} roughness={0.6} />
        </mesh>
      </group>
      <Cable p={p} />
      <Person position={[-0.6, 0, -1.3]} />
      <Person position={[0.9, 0, -1.3]} />
      <Phone position={[1.0, 0, 0.75]} rotation={0.3} />
    </group>
  )
}

// Every label is there from the start, including the cell's layers: they mark where the layers will fan out to.
function Labels() {
  return (
    <>
      <Tag at={[-1.75, 1.35, -0.25]}>Discharge station</Tag>
      <Tag at={[-0.6, 1.9, -1.3]}>Person, 1.75 m</Tag>
      <Tag at={[1.0, 0.04, 0.75]}>Phone, 15 cm</Tag>
      <Tag at={[-1.9, 0.12, 0.5]}>Lid</Tag>
      <Tag at={[1.75, 0.45, -0.6]}>Electronics, relays, cables</Tag>
      <Tag at={[-1.7, 2.1, 1.2]}>One cell, opened (enlarged)</Tag>
      <Tag at={[-0.75, 0.2, 2.1]}>32 modules of pouch cells</Tag>
      {LAYERS.slice(1, 4).map((l, i) => (
        // Alternate above and below so neighbouring labels don't collide
        <Tag key={l.name} at={[fanned(i + 1)[0], fanned(i + 1)[1] + (i % 2 ? -0.5 : 0.5), fanned(i + 1)[2]]}>
          {l.name}
        </Tag>
      ))}
    </>
  )
}

export function DisassemblyFigure({ progress }: { progress: number }) {
  return (
    // Seen from a little higher than the other figures, so the inside of the open pack shows.
    <group rotation={[0.35, 0, 0]} position={[-0.15, -0.55, 0]} scale={0.62}>
      <Scene p={progress} />
      <Labels />
    </group>
  )
}
