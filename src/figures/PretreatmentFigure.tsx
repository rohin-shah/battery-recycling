import type { ReactNode } from 'react'
import type { RouteId } from '../model/data'
import { BlackMassHeap, Cells, Foils, Modules, Shreds } from './batch'
import { ENCODING, type Ink } from './encoding'
import { BagFilter, Bench, Condenser, Drum, ElectrolyteDrum, Furnace, Melt, Puffs, Sieve, Shredder, Zigzag } from './machines'
import { Mover, Pile, type Vec } from './parts'
import { Floor, Person, Phone } from './scale'
import { Tag } from './Tag'
import { ease, Flow, GrowIn, split, StepClock } from './transition'

/**
 * Each route as a process line in real metres, one machine per flowsheet box (Blömeke et al. 2022, Figs 4–6), stepped
 * through as approved in the chapter 3 review. Stepping forward plays the work being done: material flows between
 * machines, glow ramps up and outputs pile up. A 1.75 m person stands by each machine and a phone sits by the batch,
 * for scale; machine sizes are typical and illustrative.
 */

export type Output = 'flueDust' | 'electrolyte' | 'steel' | 'lightParts' | 'blackMass' | 'copperFoil' | 'aluminiumFoil' | 'separator' | 'moduleParts' | 'alloy' | 'slag'
type BatchKind = 'modules' | 'cells' | 'shreds' | 'fine' | 'foils' | 'blackMass'
type Machine = { kind: string; at: Vec }
type FlowSpec = { from: Vec; to: Vec; color: string; count?: number; size?: number; arc?: number; start?: number; end?: number; shape?: 'box' | 'sphere'; opacity?: number }

export type PretreatmentStep = {
  label: string
  /** The point the camera centres on, and how far it zooms in (1 = about 3.8 m across). */
  focus: Vec
  zoom: number
  batch?: { kind: BatchKind; at: Vec }
  /** Glow of the furnace's pre-heating, decomposition and smelting zones. */
  zones?: [number, number, number]
  melt?: boolean
  /** Machines running this step, by index in the route's machine list. */
  active?: number[]
  flows?: FlowSpec[]
  out?: Output[]
  slagFormers?: Vec
}

export const OUTPUTS: Record<Output, { label: string; ink: Ink }> = {
  flueDust: { label: 'Flue dust', ink: 'dust' },
  electrolyte: { label: 'Electrolyte', ink: 'electrolyte' },
  steel: { label: 'Steel', ink: 'steel' },
  lightParts: { label: 'Aluminium, plastic, electronics', ink: 'aluminium' },
  moduleParts: { label: 'Aluminium, steel, plastic, electronics', ink: 'aluminium' },
  blackMass: { label: 'Black mass', ink: 'blackMass' },
  copperFoil: { label: 'Copper foil', ink: 'copper' },
  aluminiumFoil: { label: 'Aluminium foil', ink: 'aluminium' },
  separator: { label: 'Separator', ink: 'plastic' },
  alloy: { label: 'Alloy (Co, Ni, Cu, Fe)', ink: 'steel' },
  slag: { label: 'Slag (Li, Mn, Al, Si, Ca)', ink: 'slag' },
}

const PILE_COLOURS: Record<Output, string[]> = {
  flueDust: [ENCODING.dust],
  electrolyte: [],
  steel: [ENCODING.steel],
  lightParts: [ENCODING.aluminium, ENCODING.plastic, ENCODING.copper],
  moduleParts: [ENCODING.aluminium, ENCODING.steel, ENCODING.plastic],
  blackMass: [ENCODING.blackMass],
  copperFoil: [ENCODING.copper],
  aluminiumFoil: [ENCODING.aluminium],
  separator: [ENCODING.plastic],
  alloy: [ENCODING.steel],
  slag: [ENCODING.slag],
}

type Line = { machines: Machine[]; outputs: Partial<Record<Output, Vec>>; labels?: Partial<Record<Output, string>>; steps: PretreatmentStep[] }

const C = ENCODING
const LINES: Record<RouteId, Line> = {
  pyro: {
    machines: [
      { kind: 'furnace3', at: [0, 0, 0] },
      { kind: 'bagFilter', at: [3.4, 0, -1.6] },
      { kind: 'mill', at: [6.5, 0, 0] },
    ],
    outputs: { flueDust: [3.4, 0, 0.2], alloy: [6.0, 0, 1.4], slag: [7.2, 0, 1.4] },
    // Fig. 4 lists iron in Route 1's slag; Fig. 6 doesn't for Route 3.
    labels: { slag: 'Slag (Li, Mn, Al, Fe, Si, Ca)' },
    steps: [
      { label: 'Modules in', focus: [-1.6, 0.6, 0.6], zoom: 0.95, batch: { kind: 'modules', at: [-2.3, 0, 1] } },
      {
        label: 'Pre-heated',
        focus: [-0.4, 2, 0.3],
        zoom: 0.55,
        zones: [1, 0, 0],
        slagFormers: [-1.9, 0, 1.6],
        flows: [
          { from: [-2.3, 0.2, 1], to: [0, 4.1, 0], color: C.cell, count: 8, size: 0.3, arc: 1.5, end: 0.6 },
          { from: [-1.9, 0.2, 1.6], to: [0, 4.1, 0], color: C.slag, count: 30, size: 0.08, arc: 1.2, start: 0.3, end: 0.9, shape: 'sphere' },
        ],
      },
      {
        label: 'Decomposed',
        focus: [1.6, 2, -0.4],
        zoom: 0.5,
        zones: [0.4, 1, 0],
        active: [1],
        out: ['flueDust'],
        flows: [{ from: [1.2, 2.2, 0], to: [2.8, 2.6, -1.6], color: C.dust, count: 30, size: 0.18, arc: 0.3, shape: 'sphere', opacity: 0.6 }],
      },
      {
        label: 'Smelted',
        focus: [0, 1.2, 0],
        zoom: 0.75,
        zones: [0.3, 0.4, 1],
        melt: true,
        flows: [{ from: [0, 2.4, 0], to: [0, 0.6, 0], color: C.steel, count: 20, size: 0.1, arc: 0, shape: 'sphere' }],
      },
      {
        label: 'Alloy and slag milled',
        focus: [5, 1, 0.4],
        zoom: 0.5,
        melt: true,
        active: [2],
        out: ['alloy', 'slag'],
        flows: [
          { from: [1.3, 0.35, 0.8], to: [5.9, 1.4, 0], color: C.steel, count: 16, size: 0.15, arc: 1, end: 0.6 },
          { from: [1.3, 0.6, 0.8], to: [5.9, 1.4, 0], color: C.slag, count: 16, size: 0.15, arc: 1.2, start: 0.2, end: 0.7 },
        ],
      },
    ],
  },
  mechanical: {
    machines: [
      { kind: 'shredderN2', at: [0, 0, 0] },
      { kind: 'condenser', at: [3, 0, -2.2] },
      { kind: 'dryer', at: [5, 0, 0] },
      { kind: 'magnet', at: [11, 0, 0] },
      { kind: 'zigzag', at: [16, 0, 0] },
      { kind: 'shredder', at: [21, 0, 0] },
      { kind: 'sieve', at: [26, 0, 0] },
      { kind: 'zigzag', at: [31, 0, 0] },
    ],
    outputs: { electrolyte: [3.8, 0, -2.2], steel: [11.8, 0, 1.4], lightParts: [15, 0, 1.4], blackMass: [26, 0, 0.3], copperFoil: [30, 0, 1.4], aluminiumFoil: [31, 0, 1.6], separator: [32, 0, 1.4] },
    steps: [
      { label: 'Modules in', focus: [-1.3, 0.6, 0.6], zoom: 0.95, batch: { kind: 'modules', at: [-2, 0, 1] } },
      {
        label: 'Shredded under nitrogen',
        focus: [0, 1, 0.3],
        zoom: 0.6,
        active: [0],
        batch: { kind: 'shreds', at: [1.7, 0, 1] },
        flows: [{ from: [-2, 0.2, 1], to: [0, 2.1, 0], color: C.cell, count: 8, size: 0.3, arc: 1.2, end: 0.5 }],
      },
      {
        label: 'Dried',
        focus: [4, 1.2, -0.6],
        zoom: 0.45,
        active: [2],
        out: ['electrolyte'],
        batch: { kind: 'shreds', at: [7.6, 0, 1] },
        flows: [
          { from: [1.7, 0.3, 1], to: [3, 1.5, 0], color: C.blackMass, count: 30, size: 0.08, arc: 0.8, end: 0.5 },
          { from: [4.5, 2, 0], to: [3, 2.6, -2.2], color: C.electrolyte, count: 24, size: 0.12, arc: 0.6, start: 0.3, shape: 'sphere', opacity: 0.6 },
        ],
      },
      {
        label: 'Magnet removes steel',
        focus: [11, 1, 0.4],
        zoom: 0.65,
        active: [3],
        out: ['steel'],
        batch: { kind: 'shreds', at: [12.7, 0, 1] },
        flows: [
          { from: [7.6, 0.3, 1], to: [10.2, 0.6, 0.4], color: C.blackMass, count: 24, size: 0.08, arc: 0.6, end: 0.4 },
          { from: [10.8, 0.6, 0.4], to: [11, 1.5, 0], color: C.steel, count: 14, size: 0.08, arc: 0.1, start: 0.35, end: 0.7 },
          { from: [11.3, 1.4, 0.3], to: [11.8, 0.1, 1.4], color: C.steel, count: 14, size: 0.08, arc: 0.3, start: 0.55, end: 0.95 },
        ],
      },
      {
        label: 'Air sifter',
        focus: [16, 1.8, 0.4],
        zoom: 0.5,
        active: [4],
        out: ['lightParts'],
        batch: { kind: 'shreds', at: [17.4, 0, 1] },
        flows: [
          { from: [12.7, 0.3, 1], to: [16, 1.8, 0.3], color: C.blackMass, count: 24, size: 0.08, arc: 1, end: 0.45 },
          { from: [16, 2, 0.2], to: [16, 3.7, 0.2], color: C.aluminium, count: 16, size: 0.08, arc: 0, start: 0.4, end: 0.7 },
          { from: [16, 3.7, 0.2], to: [15, 0.1, 1.4], color: C.plastic, count: 16, size: 0.08, arc: 0.4, start: 0.6, end: 0.95 },
        ],
      },
      {
        label: 'Shredded again',
        focus: [21, 1, 0.3],
        zoom: 0.6,
        active: [5],
        batch: { kind: 'fine', at: [22.7, 0, 1] },
        flows: [{ from: [17.4, 0.3, 1], to: [21, 2.1, 0], color: C.blackMass, count: 30, size: 0.07, arc: 1.2, end: 0.55 }],
      },
      {
        label: 'Sieved',
        focus: [26, 0.9, 0.3],
        zoom: 0.75,
        active: [6],
        out: ['blackMass'],
        batch: { kind: 'foils', at: [26, 1.05, 0] },
        flows: [
          { from: [22.7, 0.3, 1], to: [26, 1.1, 0], color: C.blackMass, count: 30, size: 0.06, arc: 0.8, end: 0.45 },
          { from: [26, 0.95, 0], to: [26, 0.1, 0.3], color: C.blackMass, count: 40, size: 0.04, arc: 0, start: 0.4, shape: 'sphere' },
        ],
      },
      {
        label: 'Foils sorted',
        focus: [31, 1.6, 0.6],
        zoom: 0.5,
        active: [7],
        out: ['copperFoil', 'aluminiumFoil', 'separator'],
        flows: [
          { from: [26, 1.1, 0], to: [31, 1.8, 0.3], color: C.copper, count: 20, size: 0.07, arc: 1, end: 0.45 },
          { from: [31, 0.4, 0.3], to: [30, 0.1, 1.4], color: C.copper, count: 12, size: 0.07, arc: 0.3, start: 0.4, end: 0.8 },
          { from: [31, 3.6, 0.3], to: [31, 0.1, 1.6], color: C.aluminium, count: 12, size: 0.07, arc: 0.3, start: 0.45, end: 0.9 },
          { from: [31, 3.6, 0.3], to: [32, 0.1, 1.4], color: C.plastic, count: 12, size: 0.07, arc: 0.3, start: 0.5, end: 0.95 },
        ],
      },
    ],
  },
  thermal: {
    machines: [
      { kind: 'bench', at: [0, 0, 0] },
      { kind: 'kiln', at: [5, 0, 0] },
      { kind: 'shredder', at: [11, 0, 0] },
      { kind: 'magnet', at: [16, 0, 0] },
      { kind: 'sieve', at: [21, 0, 0] },
      { kind: 'zigzag', at: [26, 0, 0] },
      { kind: 'furnace1', at: [31, 0, 0] },
      { kind: 'bagFilter', at: [34, 0, -1.6] },
      { kind: 'mill', at: [37.5, 0, 0] },
    ],
    outputs: { moduleParts: [-0.8, 0, 1.3], steel: [16.8, 0, 1.4], copperFoil: [25, 0, 1.4], aluminiumFoil: [26, 0, 1.6], flueDust: [34, 0, 0.2], alloy: [37, 0, 1.4], slag: [38.2, 0, 1.4] },
    steps: [
      { label: 'Modules in', focus: [0, 0.9, 0.3], zoom: 1.2, batch: { kind: 'modules', at: [0, 0.905, 0] } },
      {
        label: 'Opened to cells',
        focus: [0, 0.9, 0.5],
        zoom: 1.2,
        out: ['moduleParts'],
        batch: { kind: 'cells', at: [0.2, 0.905, 0] },
        flows: [{ from: [0, 1.05, 0], to: [-0.8, 0.1, 1.3], color: C.aluminium, count: 16, size: 0.08, arc: 0.4, end: 0.6 }],
      },
      {
        label: 'Pyrolysed',
        focus: [5, 1.4, 0.3],
        zoom: 0.5,
        active: [1],
        batch: { kind: 'cells', at: [8, 0, 1] },
        flows: [
          { from: [0.2, 1, 0], to: [2.6, 1.4, 0], color: C.cell, count: 12, size: 0.1, arc: 0.8, end: 0.45 },
          { from: [5, 2.2, 0], to: [5, 4, 0], color: C.dust, count: 16, size: 0.25, arc: 0, start: 0.35, shape: 'sphere', opacity: 0.5 },
        ],
      },
      {
        label: 'Shredded',
        focus: [11, 1, 0.3],
        zoom: 0.6,
        active: [2],
        batch: { kind: 'shreds', at: [12.7, 0, 1] },
        flows: [{ from: [8, 0.2, 1], to: [11, 2.1, 0], color: C.cell, count: 12, size: 0.1, arc: 1.2, end: 0.5 }],
      },
      {
        label: 'Magnet removes steel',
        focus: [16, 1, 0.4],
        zoom: 0.65,
        active: [3],
        out: ['steel'],
        batch: { kind: 'shreds', at: [17.7, 0, 1] },
        flows: [
          { from: [12.7, 0.3, 1], to: [15.2, 0.6, 0.4], color: C.blackMass, count: 24, size: 0.08, arc: 0.6, end: 0.4 },
          { from: [15.8, 0.6, 0.4], to: [16, 1.5, 0], color: C.steel, count: 14, size: 0.08, arc: 0.1, start: 0.35, end: 0.7 },
          { from: [16.3, 1.4, 0.3], to: [16.8, 0.1, 1.4], color: C.steel, count: 14, size: 0.08, arc: 0.3, start: 0.55, end: 0.95 },
        ],
      },
      {
        label: 'Sieved',
        focus: [21, 0.9, 0.3],
        zoom: 0.75,
        active: [4],
        batch: { kind: 'blackMass', at: [21, 0, 0.3] },
        flows: [
          { from: [17.7, 0.3, 1], to: [21, 1.1, 0], color: C.blackMass, count: 30, size: 0.06, arc: 0.8, end: 0.45 },
          { from: [21, 0.95, 0], to: [21, 0.1, 0.3], color: C.blackMass, count: 40, size: 0.04, arc: 0, start: 0.4, shape: 'sphere' },
        ],
      },
      {
        label: 'Foils sorted',
        focus: [26, 1.6, 0.6],
        zoom: 0.5,
        active: [5],
        out: ['copperFoil', 'aluminiumFoil'],
        batch: { kind: 'blackMass', at: [27.6, 0, 1] },
        flows: [
          { from: [21, 1.1, 0], to: [26, 1.8, 0.3], color: C.copper, count: 20, size: 0.07, arc: 1, end: 0.45 },
          { from: [26, 0.4, 0.3], to: [25, 0.1, 1.4], color: C.copper, count: 12, size: 0.07, arc: 0.3, start: 0.4, end: 0.8 },
          { from: [26, 3.6, 0.3], to: [26, 0.1, 1.6], color: C.aluminium, count: 12, size: 0.07, arc: 0.3, start: 0.45, end: 0.9 },
        ],
      },
      {
        label: 'Black mass smelted',
        focus: [32.2, 1.6, -0.4],
        zoom: 0.5,
        zones: [0, 0, 1],
        melt: true,
        active: [7],
        out: ['flueDust'],
        slagFormers: [29.4, 0, 1.6],
        flows: [
          { from: [27.6, 0.3, 1], to: [31, 2.6, 0], color: C.blackMass, count: 30, size: 0.08, arc: 1.2, end: 0.5 },
          { from: [29.4, 0.2, 1.6], to: [31, 2.6, 0], color: C.slag, count: 20, size: 0.08, arc: 1, start: 0.2, end: 0.6, shape: 'sphere' },
          { from: [32, 1.8, 0], to: [33.4, 2.6, -1.6], color: C.dust, count: 24, size: 0.18, arc: 0.3, start: 0.4, shape: 'sphere', opacity: 0.6 },
        ],
      },
      {
        label: 'Alloy and slag milled',
        focus: [36, 1, 0.4],
        zoom: 0.5,
        melt: true,
        active: [8],
        out: ['alloy', 'slag'],
        flows: [
          { from: [32.2, 0.35, 0.8], to: [36.9, 1.4, 0], color: C.steel, count: 16, size: 0.15, arc: 1, end: 0.6 },
          { from: [32.2, 0.6, 0.8], to: [36.9, 1.4, 0], color: C.slag, count: 16, size: 0.15, arc: 1.2, start: 0.2, end: 0.7 },
        ],
      },
    ],
  },
}

export const PRETREATMENT: Record<RouteId, PretreatmentStep[]> = {
  pyro: LINES.pyro.steps,
  mechanical: LINES.mechanical.steps,
  thermal: LINES.thermal.steps,
}

export const outputLabel = (route: RouteId, k: Output) => LINES[route].labels?.[k] ?? OUTPUTS[k].label

/** Outputs produced up to and including `step`. */
export const outputsSoFar = (route: RouteId, step: number) => LINES[route].steps.slice(0, step + 1).flatMap((s) => s.out ?? [])

/** Each machine's label(s), relative to the machine, named as in the flowsheet boxes. */
const TAGS: Record<string, [Vec, string][]> = {
  furnace3: [[[1.3, 3.4, 1.2], 'Pre-heating'], [[1.3, 2.2, 1.2], 'Decomposition'], [[1.3, 0.8, 1.2], 'Smelting & reducing']],
  furnace1: [[[0, 2.6, 1.1], 'Furnace']],
  bagFilter: [[[0, 3.6, 0.6], 'Bag filter']],
  mill: [[[0, 2, 0], 'Mill']],
  shredderN2: [[[0, 2.2, 0.8], 'Shredder, under nitrogen']],
  shredder: [[[0, 2.2, 0.8], 'Shredder']],
  condenser: [[[0, 2.6, 0], 'Condenser']],
  dryer: [[[0, 2.1, 0.6], 'Rotary dryer']],
  kiln: [[[0, 2.5, 0.75], 'Pyrolysis kiln']],
  magnet: [[[0, 1.9, 0.4], 'Magnetic drum']],
  zigzag: [[[0, 3.6, 0.4], 'Air sifter']],
  sieve: [[[0, 1.4, 0.6], 'Sieve']],
  bench: [[[0.9, 0.95, 0.45], 'Workbench']],
}

/** Machines further than this from the focus aren't drawn, so turning the figure never swings one into view. */
const NEAR = 4.5

function MachineShape({ kind, active, s }: { kind: string; active: boolean; s: PretreatmentStep }) {
  switch (kind) {
    case 'furnace3':
      return <Furnace zones={s.zones ?? [0, 0, 0]} />
    case 'furnace1':
      return <Furnace zones={s.zones ?? [0, 0, 0]} single />
    case 'bagFilter':
      return <BagFilter active={active} />
    case 'mill':
      return <Drum active={active} length={1.6} radius={0.5} height={1.4} color={ENCODING.steel} />
    case 'shredderN2':
      return <Shredder active={active} nitrogen />
    case 'shredder':
      return <Shredder active={active} />
    case 'condenser':
      return <Condenser />
    case 'dryer':
      return <Drum active={active} hot length={4} radius={0.6} height={1.4} />
    case 'kiln':
      return <Drum active={active} hot length={5} radius={0.75} height={1.6} />
    case 'magnet':
      return <Drum active={active} length={1.2} radius={0.4} height={1.4} color="#7a4b4b" />
    case 'zigzag':
      return <Zigzag active={active} />
    case 'sieve':
      return <Sieve active={active} />
    case 'bench':
      return <Bench />
    default:
      return null
  }
}

function BatchShape({ kind }: { kind: BatchKind }): ReactNode {
  switch (kind) {
    case 'modules':
      return <Modules />
    case 'cells':
      return <Cells />
    case 'shreds':
      return <Shreds />
    case 'fine':
      return <Shreds fine />
    case 'foils':
      return <Foils />
    case 'blackMass':
      return <BlackMassHeap />
  }
}

const neg = ([x, y, z]: Vec): Vec => [-x, -y, -z]

const mix = (a: Vec, b: Vec, k: number): Vec => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]

/** `progress` is the reader's scrubber position: 2.5 is halfway through the transition into step 3. */
export function PretreatmentFigure({ route, progress }: { route: RouteId; progress: number }) {
  const line = LINES[route]
  const { step, t } = split(progress)
  const s = line.steps[step]
  // The camera glides from the previous step's view to this one as the reader scrubs.
  const prev = line.steps[Math.max(0, step - 1)]
  const k = ease(t * 1.6)
  const focus = mix(prev.focus, s.focus, k)
  const zoom = prev.zoom + (s.zoom - prev.zoom) * k
  const near = (x: number) => Math.abs(x - focus[0]) <= NEAR || Math.abs(x - s.focus[0]) <= NEAR
  const producedAt = new Map<Output, number>()
  line.steps.forEach((st, i) => st.out?.forEach((o) => producedAt.set(o, i)))
  const meltFrom = line.steps.findIndex((st) => st.melt)
  const furnace = line.machines.find((m) => m.kind.startsWith('furnace'))
  const xs = line.machines.map((m) => m.at[0])
  return (
    <StepClock progress={progress}>
      <Mover key={route} to={[0, -0.6, 0]} scale={zoom}>
        <Mover to={neg(focus)}>
          <Floor x={(Math.min(...xs) + Math.max(...xs)) / 2} width={Math.max(...xs) - Math.min(...xs) + 24} />
          {line.machines.map((m, i) => (
            <Mover key={i} to={m.at} scale={near(m.at[0]) ? 1 : 0}>
              <MachineShape kind={m.kind} active={!!s.active?.includes(i)} s={s} />
              {!['condenser', 'bagFilter'].includes(m.kind) && <Person position={[-2.1, 0, -1.4]} />}
              {TAGS[m.kind]?.map(([at, text]) => (
                <Tag key={text} at={at} show={near(m.at[0])}>
                  {text}
                </Tag>
              ))}
              {i === 0 && (
                <Tag at={[-2.1, 1.9, -1.4]} show={near(m.at[0])}>
                  Person, 1.75 m
                </Tag>
              )}
            </Mover>
          ))}
          {furnace && (
            <group position={furnace.at}>
              {s.melt && near(furnace.at[0]) && (
                <GrowIn step={meltFrom}>
                  <Melt width={furnace.kind === 'furnace1' ? 1.9 : 2.1} />
                </GrowIn>
              )}
              <Tag at={[-0.6, 0.65, 1.1]} show={!!s.melt && near(furnace.at[0])}>
                Slag
              </Tag>
              <Tag at={[0.5, 0.38, 1.1]} show={!!s.melt && near(furnace.at[0])}>
                Alloy
              </Tag>
            </group>
          )}
          {s.slagFormers && (
            <group position={s.slagFormers}>
              <Pile color={ENCODING.slag} radius={0.4} count={120} seed={41} />
            </group>
          )}
          {/* Batch and phone stay mounted (only their contents change), so their labels never unmount mid-render. */}
          <Mover to={s.batch?.at ?? focus}>
            {s.batch && (
              <GrowIn key={`${route}-${step}`} step={step} start={0.5} end={0.9}>
                <BatchShape kind={s.batch.kind} />
              </GrowIn>
            )}
            {s.batch && <Phone position={[0.55, 0, 0.35]} rotation={0.4} />}
            <Tag at={[0.55, 0.05, 0.35]} show={s.batch?.kind === 'modules' || s.batch?.kind === 'cells'}>
              Phone, 15 cm
            </Tag>
          </Mover>
          {(Object.entries(line.outputs) as [Output, Vec][]).map(([k, at]) => {
            const from = producedAt.get(k)
            const made = from !== undefined && from <= step && near(at[0])
            return (
              <group key={k} position={at}>
                {made && (
                  <GrowIn step={from} start={0.5}>
                    {k === 'electrolyte' ? <ElectrolyteDrum /> : PILE_COLOURS[k].map((c, i) => <Pile key={c} color={c} radius={0.5} count={140} seed={i + k.length * 3} />)}
                  </GrowIn>
                )}
                <Tag at={[0, k === 'electrolyte' ? 1.05 : 0.55, 0]} show={made && (from < step || t >= 0.6)}>
                  {outputLabel(route, k)}
                </Tag>
              </group>
            )
          })}
          {s.flows?.map((f, i) => (
            <Flow key={`${route}-${step}-${i}`} step={step} {...f} />
          ))}
          {/* Smoke from the kiln while pyrolysing */}
          {route === 'thermal' && step === 2 && (
            <group position={[5, 2.4, 0]}>
              <Puffs active height={1.5} size={0.4} />
            </group>
          )}
        </Mover>
      </Mover>
    </StepClock>
  )
}
