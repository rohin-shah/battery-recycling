import { MathUtils } from 'three'
import type { RouteId } from '../model/data'
import { ENCODING, type Ink } from './encoding'
import { BagFilter, Condenser, Drum, Furnace, Pallet, Shredder, Sieve } from './machines'
import { box, Particles, pile, type Region, type Stream } from './particles'
import type { Vec } from './parts'
import { Floor, Person } from './scale'
import { Tag } from './Tag'

/**
 * Each route seen whole from one fixed viewpoint, in real metres, simplified from Blömeke et al. (2022), Figs 4–6. The
 * scrubber is time: the 32 modules from chapter 2 are ~640 pieces that each follow their own path through the
 * machines, so nothing appears or disappears. Piece counts per material are illustrative, not measured.
 */

export type Output = 'flueDust' | 'electrolyte' | 'steel' | 'blackMass' | 'copperFoil' | 'aluminiumFoil' | 'separator' | 'alloy' | 'slag'

/** `label` is for the list under the figure. */
export const OUTPUTS: Record<Output, { label: string; ink: Ink }> = {
  flueDust: { label: 'Gases and dust', ink: 'dust' },
  electrolyte: { label: 'Electrolyte (the battery’s liquid)', ink: 'electrolyte' },
  steel: { label: 'Steel', ink: 'steel' },
  blackMass: { label: 'Black mass (the valuable powder)', ink: 'blackMass' },
  copperFoil: { label: 'Copper foil', ink: 'copper' },
  aluminiumFoil: { label: 'Aluminium foil', ink: 'aluminium' },
  separator: { label: 'Plastic film', ink: 'plastic' },
  alloy: { label: 'Metal alloy: cobalt, nickel, copper', ink: 'steel' },
  slag: { label: 'Slag: lithium, manganese, aluminium', ink: 'slag' },
}

export type PretreatmentStep = { label: string; out?: Output[] }

type Machine = { at: Vec; draw: (p: number) => React.ReactNode }
type Line = {
  steps: PretreatmentStep[]
  machines: Machine[]
  streams: Stream[]
  tags: [Vec, string][]
  person: Vec
  /** Centre and scale that fit the whole line in the frame. */
  frame: { c: Vec; scale: number }
}

const C = ENCODING
const modules = (c: Vec): Region => ({ kind: 'modules', c })
/** How far through step `k` (1-based) time is, clamped 0–1. */
const run = (p: number, k: number) => MathUtils.clamp(p - (k - 1), 0, 1)
/** Glow that rises over [a, b] and falls over [c, d], in scrubber time. */
const glow = (p: number, a: number, b: number, c: number, d: number) => MathUtils.clamp(Math.min((p - a) / (b - a), (d - p) / (d - c)), 0, 1)

function mechanical(): Line {
  const pal = modules([-6.2, 0, 1.8])
  const shredTop = box([-4, 1.9, 0], [0.4, 0.15, 0.3])
  const shredded = pile([-2.7, 0, 1.8], 0.6)
  const dryerIn = box([-0.8, 1.4, 0], [1.1, 0.2, 0.2])
  const dried = pile([0.6, 0, 1.9], 0.6)
  const drum = box([0, 0.35, -2], [0.18, 0.28, 0.18])
  const magnetTop = box([2.4, 1.85, 0], [0.4, 0.08, 0.3])
  const tray = box([4.8, 1.12, 0], [0.8, 0.05, 0.45])
  const first = [pal, { via: [shredTop], to: shredded }]
  return {
    steps: [
      { label: 'Modules in' },
      { label: 'Shredded' },
      { label: 'Dried', out: ['electrolyte'] },
      { label: 'Sorted', out: ['steel', 'blackMass', 'copperFoil', 'aluminiumFoil', 'separator'] },
    ],
    machines: [
      { at: [-6.2, 0, 1.8], draw: () => <Pallet /> },
      { at: [-4, 0, 0], draw: (p) => <Shredder run={run(p, 1)} nitrogen /> },
      { at: [-0.8, 0, 0], draw: (p) => <Drum run={run(p, 2)} heat={glow(p, 1.1, 1.4, 1.85, 2)} length={3} radius={0.55} height={1.4} /> },
      { at: [-0.8, 0, -2], draw: () => <Condenser /> },
      { at: [2.4, 0, 0], draw: (p) => <Drum run={run(p, 3)} length={1.2} radius={0.4} height={1.4} color="#7a4b4b" /> },
      { at: [4.8, 0, 0], draw: (p) => <Sieve run={run(p, 3)} /> },
    ],
    streams: [
      { color: C.blackMass, count: 260, legs: [...first, { via: [dryerIn], to: dried }, { via: [tray], to: pile([4.8, 0, 0], 0.65, 0.55) }] },
      { color: C.copper, count: 70, legs: [...first, { via: [dryerIn], to: dried }, { via: [tray], to: pile([4.0, 0, 1.9], 0.35) }] },
      { color: C.aluminium, count: 100, legs: [...first, { via: [dryerIn], to: dried }, { via: [tray], to: pile([5.0, 0, 1.95], 0.4) }] },
      { color: C.plastic, count: 60, legs: [...first, { via: [dryerIn], to: dried }, { via: [tray], to: pile([5.95, 0, 1.5], 0.3) }] },
      { color: C.steel, count: 60, legs: [...first, { via: [dryerIn], to: dried }, { via: [magnetTop], to: pile([2.4, 0, 1.9], 0.4) }] },
      { color: C.electrolyte, count: 90, legs: [...first, { via: [dryerIn], to: drum }, drum] },
    ],
    tags: [
      [[-4, 2.4, 0.8], 'Shredder'],
      [[-0.8, 2.2, 0.5], 'Dryer'],
      [[0, 1.1, -2], 'Electrolyte'],
      [[2.4, 2.2, 0.3], 'Magnet'],
      [[4.8, 1.5, 0.5], 'Sieve'],
      [[2.4, 0.6, 1.9], 'Steel'],
      [[4.8, 0.8, 0.2], 'Black mass'],
      [[4.0, 0.5, 2.1], 'Copper'],
      [[5.1, 0.6, 2.2], 'Aluminium'],
    ],
    person: [-1.6, 0, -3],
    frame: { c: [-0.4, 0.4, -1.5], scale: 0.27 },
  }
}

function melt(): Line {
  const pal = modules([-3.4, 0, 1.8])
  const formers = pile([-2.6, 0, -0.9], 0.5)
  const top = box([0, 2.7, 0], [0.4, 0.1, 0.4])
  const mix = box([0, 0.7, 0], [0.8, 0.45, 0.8])
  const tap = box([1.25, 0.35, 0.6], [0.08, 0.08, 0.08])
  const gas = box([3.1, 5.5, -1.4], [0.6, 0.35, 0.6])
  const alloy = pile([2.3, 0, 1.9], 0.5)
  const slag = pile([3.6, 0, 1.9], 0.55)
  return {
    steps: [{ label: 'Modules in' }, { label: 'Melted', out: ['flueDust'] }, { label: 'Metal and slag separate', out: ['alloy', 'slag'] }],
    machines: [
      { at: [-3.4, 0, 1.8], draw: () => <Pallet /> },
      { at: [0, 0, 0], draw: (p) => <Furnace heat={glow(p, 0.4, 0.8, 1.6, 2)} /> },
      { at: [2.4, 0, -1.4], draw: () => <BagFilter /> },
    ],
    streams: [
      { color: C.steel, count: 170, legs: [pal, { via: [top], to: mix }, { via: [tap], to: alloy }] },
      { color: C.slag, count: 150, legs: [pal, { via: [top], to: mix }, { via: [tap], to: slag }] },
      { color: C.dust, count: 320, legs: [pal, { via: [top, mix], to: gas }, gas] },
      { color: '#d8d2c2', startColor: '#d8d2c2', count: 100, legs: [formers, { via: [top], to: mix }, { via: [tap], to: slag }], recolor: { step: 2, color: C.slag } },
    ],
    tags: [
      [[0, 2.9, 1.1], 'Furnace'],
      [[-2.6, 0.6, -0.9], 'Limestone and sand'],
      [[2.4, 3.4, -1.2], 'Dust filter'],
      [[3.1, 6.1, -1.4], 'Gases and dust'],
      [[2.3, 0.6, 2.1], 'Metal alloy'],
      [[3.6, 0.7, 2.1], 'Slag'],
    ],
    person: [-1.8, 0, -2.4],
    frame: { c: [0.1, 2.6, -1.4], scale: 0.3 },
  }
}

function bake(): Line {
  const pal = modules([-6.6, 0, 1.8])
  const kilnIn = box([-4.2, 1.4, 0], [1.3, 0.25, 0.25])
  const kilnGas = box([-4.2, 2.8, 0], [1.1, 0.25, 0.35])
  const baked = pile([-2.2, 0, 1.9], 0.55)
  const shredTop = box([-0.2, 1.9, 0], [0.4, 0.15, 0.3])
  const magnetTop = box([2.2, 1.85, 0], [0.4, 0.08, 0.3])
  const tray = box([4.6, 1.12, 0], [0.8, 0.05, 0.45])
  const bm = pile([4.6, 0, 0], 0.6, 0.5)
  const top = box([4.6, 2.7, -3.8], [0.4, 0.1, 0.4])
  const tap = box([5.85, 0.35, -3.2], [0.08, 0.08, 0.08])
  const alloy = pile([6.8, 0, -2.4], 0.45)
  const slag = pile([7.9, 0, -2.9], 0.5)
  const formers = pile([2.6, 0, -3.6], 0.45)
  const first = [pal, { via: [kilnIn], to: baked }]
  const sorted = (to: Region, via: Region) => ({ via: [shredTop, via], to })
  return {
    steps: [
      { label: 'Modules in' },
      { label: 'Baked' },
      { label: 'Shredded and sorted', out: ['steel', 'copperFoil', 'aluminiumFoil'] },
      { label: 'Black mass melted', out: ['alloy', 'slag'] },
    ],
    machines: [
      { at: [-6.6, 0, 1.8], draw: () => <Pallet /> },
      { at: [-4.2, 0, 0], draw: (p) => <Drum run={run(p, 1)} heat={glow(p, 0.2, 0.5, 0.85, 1)} length={3.4} radius={0.65} height={1.5} /> },
      { at: [-0.2, 0, 0], draw: (p) => <Shredder run={run(p, 2)} /> },
      { at: [2.2, 0, 0], draw: (p) => <Drum run={run(p, 2)} length={1.2} radius={0.4} height={1.4} color="#7a4b4b" /> },
      { at: [4.6, 0, 0], draw: (p) => <Sieve run={run(p, 2)} /> },
      { at: [4.6, 0, -3.8], draw: (p) => <Furnace heat={glow(p, 2.3, 2.6, 2.95, 3)} /> },
    ],
    streams: [
      { color: C.dust, count: 140, legs: [pal, { via: [kilnIn], to: kilnGas }, kilnGas, kilnGas] },
      { color: C.steel, count: 60, legs: [...first, sorted(pile([2.2, 0, 1.9], 0.4), magnetTop), pile([2.2, 0, 1.9], 0.4)] },
      { color: C.copper, count: 70, legs: [...first, sorted(pile([3.9, 0, 1.9], 0.35), tray), pile([3.9, 0, 1.9], 0.35)] },
      { color: C.aluminium, count: 100, legs: [...first, sorted(pile([4.9, 0, 1.95], 0.4), tray), pile([4.9, 0, 1.95], 0.4)] },
      { color: C.blackMass, count: 120, legs: [...first, sorted(bm, tray), { via: [top, tap], to: alloy }], recolor: { step: 3, color: C.steel } },
      { color: C.blackMass, count: 150, legs: [...first, sorted(bm, tray), { via: [top, tap], to: slag }], recolor: { step: 3, color: C.slag } },
      { color: '#d8d2c2', startColor: '#d8d2c2', count: 80, legs: [formers, formers, formers, { via: [top, tap], to: slag }], recolor: { step: 3, color: C.slag } },
    ],
    tags: [
      [[-4.2, 2.5, 0.7], 'Oven (kiln)'],
      [[-4.2, 3.3, 0], 'Gases'],
      [[-0.2, 2.4, 0.8], 'Shredder'],
      [[2.2, 2.2, 0.3], 'Magnet'],
      [[4.6, 1.5, 0.5], 'Sieve'],
      [[4.6, 0.75, 0.2], 'Black mass'],
      [[4.6, 2.9, -2.7], 'Furnace'],
      [[2.6, 0.6, -3.6], 'Limestone and sand'],
      [[6.8, 0.55, -2.2], 'Metal alloy'],
      [[7.9, 0.6, -2.7], 'Slag'],
    ],
    person: [0.4, 0, -2.2],
    frame: { c: [0.9, 0.4, -2.2], scale: 0.25 },
  }
}

const LINES: Record<RouteId, Line> = { pyro: melt(), mechanical: mechanical(), thermal: bake() }

export const PRETREATMENT: Record<RouteId, PretreatmentStep[]> = {
  pyro: LINES.pyro.steps,
  mechanical: LINES.mechanical.steps,
  thermal: LINES.thermal.steps,
}

export const outputLabel = (_route: RouteId, k: Output) => OUTPUTS[k].label

/** Outputs produced up to and including `step`. */
export const outputsSoFar = (route: RouteId, step: number) => LINES[route].steps.slice(0, step + 1).flatMap((s) => s.out ?? [])

/** `progress` is the reader's scrubber position: 2.5 is halfway through the step into "Sorted", say. */
export function PretreatmentFigure({ route, progress }: { route: RouteId; progress: number }) {
  const line = LINES[route]
  const { c, scale } = line.frame
  return (
    // A line of machines is long and low, so it's seen from higher up and square-on, reading left to right.
    // Undo the shared 30° turn, then tilt: two groups, because a single rotation tilts about the turned axis.
    <group key={route} rotation={[0, Math.PI / 6, 0]}>
      <group rotation={[0.8, 0, 0]} scale={scale} position={[-c[0] * scale, -c[1] * scale, -c[2] * scale]}>
      <Floor x={c[0]} width={24} />
      {line.machines.map((m, i) => (
        <group key={i} position={m.at}>
          {m.draw(progress)}
        </group>
      ))}
      <Person position={line.person} />
      <Particles streams={line.streams} progress={progress} />
      {line.tags.map(([at, text]) => (
        <Tag key={text} at={at}>
          {text}
        </Tag>
      ))}
      <Tag at={[line.person[0], 1.95, line.person[2]]}>Person, 1.75 m</Tag>
      </group>
    </group>
  )
}

