import type { ReactNode } from 'react'
import type { RouteId } from '../model/data'
import { ENCODING, type Ink } from './encoding'
import { BagFilter, Bench, Condenser, Drum, Furnace, Sieve, Shredder, Zigzag } from './machines'
import { Module, Mover, Pile, type Vec } from './parts'

/**
 * Each route as a process line, one machine per flowsheet box (Blömeke et al. 2022, Figs 4–6), stepped through as
 * approved in the chapter 3 review. The line pans so the active machine is centred; only nearby machines are drawn.
 */

export type Output = 'flueDust' | 'electrolyte' | 'steel' | 'lightParts' | 'blackMass' | 'copperFoil' | 'aluminiumFoil' | 'separator' | 'moduleParts' | 'alloy' | 'slag'
type Material = 'modules' | 'cells' | 'pieces' | 'fine' | 'blackMass' | 'none'
type Machine = { kind: string; x: number; z?: number }

export type PretreatmentStep = {
  label: string
  /** x of the machine the camera centres on */
  focus: number
  material: Material
  /** Outputs produced at this step; they stay on their piles for later steps. */
  out?: Output[]
  /** Glow levels for the furnace's pre-heating, decomposition and smelting zones. */
  zones?: [number, number, number]
  melt?: boolean
  /** Machine kinds that are running this step */
  active?: string[]
  slagFormers?: boolean
}

export const OUTPUTS: Record<Output, { label: string; ink: Ink; colors: string[] }> = {
  flueDust: { label: 'Flue dust', ink: 'dust', colors: [ENCODING.dust] },
  electrolyte: { label: 'Electrolyte', ink: 'electrolyte', colors: [ENCODING.electrolyte] },
  steel: { label: 'Steel', ink: 'steel', colors: [ENCODING.steel] },
  lightParts: { label: 'Aluminium, plastic, electronics', ink: 'aluminium', colors: [ENCODING.aluminium, ENCODING.plastic, ENCODING.copper] },
  moduleParts: { label: 'Aluminium, steel, plastic, electronics', ink: 'aluminium', colors: [ENCODING.aluminium, ENCODING.steel, ENCODING.plastic] },
  blackMass: { label: 'Black mass', ink: 'blackMass', colors: [ENCODING.blackMass] },
  copperFoil: { label: 'Copper foil', ink: 'copper', colors: [ENCODING.copper] },
  aluminiumFoil: { label: 'Aluminium foil', ink: 'aluminium', colors: [ENCODING.aluminium] },
  separator: { label: 'Separator', ink: 'plastic', colors: [ENCODING.plastic] },
  alloy: { label: 'Alloy (Co, Ni, Cu, Fe)', ink: 'steel', colors: [ENCODING.steel] },
  slag: { label: 'Slag (Li, Mn, Al, Si, Ca)', ink: 'slag', colors: [ENCODING.slag] },
}

const LINES: Record<RouteId, { machines: Machine[]; outputAt: Partial<Record<Output, number>>; labels?: Partial<Record<Output, string>>; steps: PretreatmentStep[] }> = {
  pyro: {
    machines: [
      { kind: 'furnace3', x: 0 },
      { kind: 'bagFilter', x: 0.85, z: -0.6 },
      { kind: 'mill', x: 2.6 },
    ],
    outputAt: { flueDust: 0.85, alloy: 2.4, slag: 2.9 },
    // Fig. 4 lists iron in Route 1's slag; Fig. 6 doesn't for Route 3.
    labels: { slag: 'Slag (Li, Mn, Al, Fe, Si, Ca)' },
    steps: [
      { label: 'Modules in', focus: 0, material: 'modules' },
      { label: 'Pre-heated', focus: 0, material: 'none', zones: [0.8, 0, 0], slagFormers: true },
      { label: 'Decomposed', focus: 0.4, material: 'none', zones: [0.3, 1, 0], out: ['flueDust'], active: ['bagFilter'], slagFormers: true },
      { label: 'Smelted', focus: 0, material: 'none', zones: [0.2, 0.3, 1.6], melt: true },
      { label: 'Alloy and slag milled', focus: 2.6, material: 'none', melt: true, out: ['alloy', 'slag'], active: ['mill'] },
    ],
  },
  mechanical: {
    machines: [
      { kind: 'shredderN2', x: 0 },
      { kind: 'condenser', x: 0.8, z: -1.0 },
      { kind: 'dryer', x: 1.6 },
      { kind: 'magnet', x: 3.2 },
      { kind: 'zigzag', x: 4.8 },
      { kind: 'shredder', x: 6.4 },
      { kind: 'sieve', x: 8.0 },
      { kind: 'zigzag', x: 9.6 },
    ],
    outputAt: { electrolyte: 1.1, steel: 3.2, lightParts: 4.8, blackMass: 8.0, copperFoil: 9.3, aluminiumFoil: 9.7, separator: 10.1 },
    steps: [
      { label: 'Modules in', focus: 0, material: 'modules' },
      { label: 'Shredded under nitrogen', focus: 0, material: 'pieces', active: ['shredderN2'] },
      { label: 'Dried', focus: 1.6, material: 'pieces', out: ['electrolyte'], active: ['dryer'] },
      { label: 'Magnet removes steel', focus: 3.2, material: 'pieces', out: ['steel'], active: ['magnet'] },
      { label: 'Air sifter', focus: 4.8, material: 'pieces', out: ['lightParts'], active: ['zigzag@4.8'] },
      { label: 'Shredded again', focus: 6.4, material: 'fine', active: ['shredder'] },
      { label: 'Sieved', focus: 8.0, material: 'fine', out: ['blackMass'], active: ['sieve'] },
      { label: 'Foils sorted', focus: 9.6, material: 'none', out: ['copperFoil', 'aluminiumFoil', 'separator'], active: ['zigzag@9.6'] },
    ],
  },
  thermal: {
    machines: [
      { kind: 'bench', x: 0 },
      { kind: 'kiln', x: 1.6 },
      { kind: 'shredder', x: 3.2 },
      { kind: 'magnet', x: 4.8 },
      { kind: 'sieve', x: 6.4 },
      { kind: 'zigzag', x: 8.0 },
      { kind: 'furnace1', x: 9.6 },
      { kind: 'bagFilter', x: 10.4, z: -0.5 },
      { kind: 'mill', x: 11.6 },
    ],
    outputAt: { moduleParts: 0.2, steel: 4.8, copperFoil: 7.8, aluminiumFoil: 8.2, flueDust: 10.4, alloy: 11.4, slag: 11.9 },
    steps: [
      { label: 'Modules in', focus: 0, material: 'modules' },
      { label: 'Opened to cells', focus: 0, material: 'cells', out: ['moduleParts'] },
      { label: 'Pyrolysed', focus: 1.6, material: 'cells', active: ['kiln'] },
      { label: 'Shredded', focus: 3.2, material: 'pieces', active: ['shredder'] },
      { label: 'Magnet removes steel', focus: 4.8, material: 'pieces', out: ['steel'], active: ['magnet'] },
      { label: 'Sieved', focus: 6.4, material: 'blackMass', active: ['sieve'] },
      { label: 'Foils sorted', focus: 8.0, material: 'blackMass', out: ['copperFoil', 'aluminiumFoil'], active: ['zigzag'] },
      { label: 'Black mass smelted', focus: 9.6, material: 'none', zones: [0, 0, 1.6], melt: true, out: ['flueDust'], active: ['bagFilter'], slagFormers: true },
      { label: 'Alloy and slag milled', focus: 11.6, material: 'none', melt: true, out: ['alloy', 'slag'], active: ['mill'] },
    ],
  },
}

export const PRETREATMENT: Record<RouteId, PretreatmentStep[]> = {
  pyro: LINES.pyro.steps,
  mechanical: LINES.mechanical.steps,
  thermal: LINES.thermal.steps,
}

export const outputLabel = (route: RouteId, k: Output) => LINES[route].labels?.[k] ?? OUTPUTS[k].label

/** Outputs produced up to and including step `step`. */
export const outputsSoFar = (route: RouteId, step: number) => LINES[route].steps.slice(0, step + 1).flatMap((s) => s.out ?? [])

// Only the active machine and what's attached to it (condenser, bag filter), so turning the figure never swings a
// neighbour in front of it. Earlier outputs stay listed under the figure.
const NEAR = 0.9

function MachineShape({ m, s }: { m: Machine; s: PretreatmentStep }) {
  const on = (s.active ?? []).some((a) => a === m.kind || a === `${m.kind}@${m.x}`)
  switch (m.kind) {
    case 'furnace3':
    case 'furnace1':
      return <Furnace zones={s.zones ?? [0, 0, 0]} melt={!!s.melt} single={m.kind === 'furnace1'} />
    case 'bagFilter':
      return <BagFilter active={on} />
    case 'mill':
      return <Drum active={on} color={ENCODING.steel} length={0.6} radius={0.2} />
    case 'shredderN2':
      return <Shredder active={on} nitrogen />
    case 'shredder':
      return <Shredder active={on} />
    case 'condenser':
      return <Condenser full={s.out?.includes('electrolyte') || false} />
    case 'dryer':
      return <Drum active={on} hot />
    case 'kiln':
      return <Drum active={on} hot length={1.0} radius={0.3} />
    case 'magnet':
      return <Drum active={on} color="#7a4b4b" length={0.7} radius={0.22} />
    case 'zigzag':
      return <Zigzag active={on} />
    case 'sieve':
      return <Sieve active={on} />
    case 'bench':
      return <Bench />
    default:
      return null
  }
}

/** The batch being processed, shown at the active machine. */
function Batch({ material }: { material: Material }) {
  if (material === 'modules')
    return (
      <group position={[-0.8, -0.2, 0]} scale={0.6}>
        {[0, 1, 2, 3].map((i) => (
          <group key={i} position={[(i % 2) * 0.42 - 0.21, Math.floor(i / 2) * 0.28, 0]}>
            <Module />
          </group>
        ))}
      </group>
    )
  if (material === 'cells')
    return (
      <group position={[0, -0.15, 0.1]}>
        {Array.from({ length: 10 }, (_, i) => (
          <mesh key={i} position={[(i % 5) * 0.16 - 0.32, 0.02 * Math.floor(i / 5), Math.floor(i / 5) * 0.2 - 0.1]}>
            <boxGeometry args={[0.12, 0.02, 0.18]} />
            <meshStandardMaterial color={ENCODING.cell} />
          </mesh>
        ))}
      </group>
    )
  if (material === 'pieces' || material === 'fine') {
    const r = material === 'pieces' ? 0.32 : 0.26
    return (
      <group position={[0.55, -0.55, 0.35]}>
        <Pile color={ENCODING.blackMass} radius={r} count={150} seed={21} />
        <Pile color={ENCODING.copper} radius={r} count={40} seed={22} />
        <Pile color={ENCODING.aluminium} radius={r} count={40} seed={23} />
      </group>
    )
  }
  if (material === 'blackMass')
    return (
      <group position={[0.55, -0.55, 0.35]}>
        <Pile color={ENCODING.blackMass} radius={0.3} count={200} seed={24} />
      </group>
    )
  return null
}

function OutputPile({ kind, x, visible }: { kind: Output; x: number; visible: boolean }) {
  const { colors } = OUTPUTS[kind]
  let piles: ReactNode = colors.map((c, i) => <Pile key={c} color={c} radius={0.26} count={kind === 'blackMass' ? 180 : 90} seed={i + kind.length * 3} />)
  if (kind === 'electrolyte') piles = null // collected in the condenser's drum
  return (
    <Mover to={[x, -0.6, 0.75] as Vec} scale={visible ? 1 : 0}>
      {piles}
    </Mover>
  )
}

export function PretreatmentFigure({ route, step }: { route: RouteId; step: number }) {
  const line = LINES[route]
  const s = line.steps[step]
  const made = new Set(outputsSoFar(route, step))
  const near = (x: number) => Math.abs(x - s.focus) <= NEAR
  return (
    <group scale={1.1}>
      {/* The whole line slides so the active machine sits in the middle. */}
      <Mover to={[-s.focus, 0, 0]}>
        {line.machines.map((m, i) => (
          <Mover key={`${route}-${i}`} to={[m.x, 0, m.z ?? 0]} scale={near(m.x) ? 1 : 0}>
            <MachineShape m={m} s={s} />
          </Mover>
        ))}
        {s.slagFormers && (
          <Mover to={[s.focus - 0.75, -0.6, 0.45]}>
            <Pile color={ENCODING.slag} radius={0.18} count={60} seed={41} />
          </Mover>
        )}
        <group position={[s.focus, 0, 0]}>
          <Batch material={s.material} />
        </group>
        {(Object.entries(line.outputAt) as [Output, number][]).map(([k, x]) => (
          <OutputPile key={`${route}-${k}`} kind={k} x={x} visible={made.has(k) && near(x)} />
        ))}
      </Mover>
    </group>
  )
}
