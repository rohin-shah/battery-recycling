import { useMemo, useState } from 'react'
import {
  ACID_MAX, ACID_MEASURED_FROM, ACID_MIN, IMPURITY_PH, LEACH_METALS, leached, METALS, MIXED_METALS, MIXED_PH, settled, settledMixed,
  type LeachMetal, type Metal, type MixedMetal,
} from './data'
import { Chart, Frame } from './Frame'
import { COLOUR, drift, inTube, pile, R, TUBE, type Vec } from './layout'
import { type Bead, Beads, Stage } from './scene'
import './hydromet.css'

const NAME = { iron: 'Iron', aluminium: 'Aluminium', nickel: 'Nickel', cobalt: 'Cobalt', manganese: 'Manganese', lithium: 'Lithium' } as const
const pct = (v: number) => `${Math.round(v)}%`

const METAL = 0.07
const OXYGEN = 0.05
const HYDROGEN = 0.028
/** Where the hydrogens sit on an oxygen: two for water, the first alone for a hydroxide ion. */
const ON_OXYGEN: Vec[] = [[0.052, 0.036, 0], [-0.052, 0.036, 0]]

/** Metal beads for a figure: each has a rank within its metal, and moves once that share of the metal has. */
function metalBeads<M extends string>(counts: Record<M, number>, order: M[]) {
  return order.flatMap((metal) => Array.from({ length: counts[metal] }, (_, i) => ({ metal, rank: (i + 0.5) / counts[metal] })))
}

/** The slider value at which each bead first moves (Infinity if it never does), scanning the range in small steps. */
function firstMove<M extends string>(beads: { metal: M; rank: number }[], share: (m: M, v: number) => number, [min, max]: [number, number]) {
  const step = (max - min) / 900
  return beads.map((b) => {
    for (let v = min; v <= max + 1e-9; v += step) if (b.rank < share(b.metal, v) / 100) return v
    return Infinity
  })
}

/** A few water molecules drifting in the liquid, so the reader can see what the ions turn into. */
function water(n: number, salt: number, base: number): Bead[] {
  const oxygens: Bead[] = Array.from({ length: n }, (_, k) => ({ size: OXYGEN, aim: () => ({ to: drift(k, salt), jig: 0.03, color: COLOUR.oxygen }) }))
  const hydrogens: Bead[] = Array.from({ length: n * 2 }, (_, k) => ({
    size: HYDROGEN,
    aim: () => ({ on: base + Math.floor(k / 2), offset: ON_OXYGEN[k % 2], color: COLOUR.hydrogen }),
  }))
  return [...oxygens, ...hydrogens]
}

// ───────────────────────────── Figure 1: acid dissolving the metals ─────────────────────────────

const LEACH_COUNT: Record<LeachMetal, number> = { lithium: 12, nickel: 5, cobalt: 4, manganese: 3 } // by atoms in the powder Chen & Ho tested
const FREE_IONS = 16

function dissolveBeads(): Bead[] {
  const metals = metalBeads(LEACH_COUNT, LEACH_METALS)
  const n = metals.length
  const at = firstMove(metals, leached, [ACID_MIN, ACID_MAX])
  // The last to dissolve sit at the bottom middle of the heap; the first sit on its top and edges.
  const slot = new Array<number>(n)
  metals.map((_, i) => i).sort((a, b) => at[b] - at[a] || a - b).forEach((i, s) => (slot[i] = s))
  const gone = (j: number, acid: number) => metals[j].rank < leached(metals[j].metal, acid) / 100
  const O = n // index of the first oxygen
  return [
    // Metals: packed in the solid, then loose in the liquid.
    ...metals.map((m, j): Bead => ({
      size: METAL,
      aim: (acid) => (gone(j, acid) ? { to: drift(j), jig: 0.035, color: COLOUR[m.metal] } : { to: pile(slot[j] * 2), color: COLOUR[m.metal] }),
    })),
    // Each metal's oxygen: beside it in the solid, then carried off as water.
    ...metals.map((_, j): Bead => ({
      size: OXYGEN,
      aim: (acid) => (gone(j, acid) ? { to: drift(j, 7), jig: 0.03, color: COLOUR.oxygen } : { to: pile(slot[j] * 2 + 1), color: COLOUR.oxygen }),
    })),
    // Two hydrogen ions per oxygen: waiting in the acid tube, then bonded to that oxygen as water.
    ...Array.from({ length: n * 2 }, (_, k): Bead => {
      const j = Math.floor(k / 2)
      return {
        size: HYDROGEN,
        aim: (acid) => (gone(j, acid) ? { on: O + j, offset: ON_OXYGEN[k % 2], color: COLOUR.hydrogen } : { to: inTube(k), color: COLOUR.hydrogenIon }),
      }
    }),
    // Spare hydrogen ions: the stronger the acid, the more of them are loose in the liquid.
    ...Array.from({ length: FREE_IONS }, (_, k): Bead => ({
      size: HYDROGEN,
      aim: (acid) =>
        acid > ((k + 0.5) / FREE_IONS) * ACID_MAX ? { to: drift(k, 11), jig: 0.07, color: COLOUR.hydrogenIon } : { to: inTube(n * 2 + k), color: COLOUR.hydrogenIon },
    })),
    ...water(8, 21, n * 4 + FREE_IONS),
  ]
}

/** Flakes of graphite in the heap. They are never touched by the acid, so they never move. */
function Graphite() {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = i * 1.2566 + 0.5
        return (
          <mesh key={i} position={[Math.cos(a) * 0.66, 0.115 + (i % 2) * 0.03, Math.sin(a) * 0.66]} rotation={[0.25 * Math.sin(i * 2.1), a, 0.2 * Math.cos(i * 1.7)]}>
            <cylinderGeometry args={[0.13, 0.13, 0.035, 6]} />
            <meshStandardMaterial color="#3a3f42" roughness={0.35} metalness={0.5} />
          </mesh>
        )
      })}
    </>
  )
}

export function DissolveFigure() {
  const [acid, setAcid] = useState(ACID_MIN)
  const beads = useMemo(() => dissolveBeads(), [])
  const total = LEACH_METALS.reduce((s, m) => s + LEACH_COUNT[m], 0)
  const overall = LEACH_METALS.reduce((s, m) => s + leached(m, acid) * LEACH_COUNT[m], 0) / total
  return (
    <Frame
      view={
        <Stage
          label={`A beaker of battery powder in ${acid === 0 ? 'water' : `acid of strength ${acid.toFixed(2)} moles per litre`}`}
          labels={[
            { at: [0.17, TUBE[1] + 0.34, 0], text: 'Acid: hydrogen ions' },
            { at: [R + 0.1, 1.0, 0], text: 'Dissolved metals' },
            { at: [R + 0.1, 0.16, 0], text: 'Black mass' },
          ]}
        >
          <Beads beads={beads} value={acid} />
          <Graphite />
        </Stage>
      }
      chart={
        <Chart
          label="Share of each metal dissolved, against the strength of the acid"
          series={LEACH_METALS.map((m) => ({ name: m, color: COLOUR[m], y: (x) => leached(m, x) }))}
          range={[ACID_MIN, ACID_MAX]} ticks={[0, 0.5, 1, 1.5, 2]} left="water" right="stronger acid (mol/L)" value={acid}
          shade={[ACID_MIN, ACID_MEASURED_FROM]}
        />
      }
      keyTitle="Share dissolved"
      keys={[
        ...LEACH_METALS.map((m) => ({ name: NAME[m], color: COLOUR[m], note: pct(leached(m, acid)) })),
        { name: 'Oxygen', color: COLOUR.oxygen },
        { name: 'Hydrogen ion', color: COLOUR.hydrogenIon },
        { name: 'Water', color: COLOUR.hydrogen },
        { name: 'Graphite', color: '#5a6064' },
      ]}
      readouts={[
        { name: 'Metals dissolved', value: pct(overall) },
        { name: 'Graphite dissolved', value: '0%' },
        { name: 'Acid strength, mol/L', value: acid.toFixed(2) },
      ]}
      equations={[
        'metal oxide + hydrogen ions → dissolved metal + water',
        'MO + 2 H⁺ → M²⁺ + H₂O',
        'In practice, with hydrogen peroxide to help: 2 LiCoO₂ + 6 H⁺ + H₂O₂ → 2 Li⁺ + 2 Co²⁺ + 4 H₂O + O₂',
      ]}
      slider={{
        left: 'water', right: 'stronger acid', text: acid === 0 ? 'no acid' : `${acid.toFixed(2)} mol/L sulfuric acid`,
        min: ACID_MIN, max: ACID_MAX, step: 0.01, value: acid, set: setAcid, label: 'Acid strength',
      }}
      caption={
        <>
          Measured from 0.25 mol/L upwards by Chen &amp; Ho (2018), Metals 8, 321, CC BY 4.0 (with 10% hydrogen peroxide, two hours, 25 °C). Below
          that, in the shaded part of the chart, the lines are drawn straight to zero. Bead counts are illustrative; the mix of metals follows the
          powder they tested.
        </>
      }
    />
  )
}

// ───────────────────────────── Shared by figures 2 and 3: settling out as hydroxide goes in ─────────────────────────────

/**
 * Metals that settle as the solution is made less acidic, plus the ions that drive it: loose hydrogen ions in the
 * liquid and hydroxide ions waiting in the tube. Each hydroxide is released at its own pH. The first ones each find a
 * hydrogen ion and become water; once the hydrogen ions are used up, the rest stay loose in the liquid.
 */
function settleBeads<M extends string>(
  counts: Record<M, number>, order: M[], share: (m: M, pH: number) => number, colour: (m: M) => string,
  range: [number, number], hydrogenIons: number, hydroxides: number, neutralAt: number,
): Bead[] {
  const metals = metalBeads(counts, order)
  const n = metals.length
  const at = firstMove(metals, share, range)
  const slot = new Array<number>(n)
  metals.map((_, i) => i).sort((a, b) => at[a] - at[b] || a - b).forEach((i, s) => (slot[i] = s))
  // Release points: the hydrogen ions are used up evenly between the start and `neutralAt`, the rest after it.
  const release = (k: number) =>
    k < hydrogenIons
      ? range[0] + ((k + 0.5) / hydrogenIons) * (neutralAt - range[0])
      : neutralAt + ((k - hydrogenIons + 0.5) / (hydroxides - hydrogenIons)) * (range[1] - neutralAt)
  const OH = n + hydrogenIons // index of the first hydroxide oxygen
  return [
    ...metals.map((m, j): Bead => ({
      size: METAL,
      aim: (pH) => (m.rank < share(m.metal, pH) / 100 ? { to: pile(slot[j]), color: colour(m.metal) } : { to: drift(j), jig: 0.035, color: colour(m.metal) }),
    })),
    // Hydrogen ions: loose, until a hydroxide arrives and the two become water.
    ...Array.from({ length: hydrogenIons }, (_, k): Bead => ({
      size: HYDROGEN,
      aim: (pH) => (pH >= release(k) ? { on: OH + k, offset: ON_OXYGEN[1], color: COLOUR.hydrogen } : { to: drift(k, 31), jig: 0.07, color: COLOUR.hydrogenIon }),
    })),
    // Hydroxide ions: an oxygen with one hydrogen, waiting in the tube and then loose in the liquid.
    ...Array.from({ length: hydroxides }, (_, k): Bead => ({
      size: OXYGEN,
      aim: (pH) => (pH >= release(k) ? { to: drift(k, 41), jig: 0.04, color: COLOUR.oxygen } : { to: inTube(k), color: COLOUR.oxygen }),
    })),
    ...Array.from({ length: hydroxides }, (_, k): Bead => ({ size: HYDROGEN, aim: () => ({ on: OH + k, offset: ON_OXYGEN[0], color: COLOUR.hydrogen }) })),
    ...water(6, 21, n + hydrogenIons + hydroxides * 2),
  ]
}

const ION_KEYS = [
  { name: 'Hydrogen ion', color: COLOUR.hydrogenIon },
  { name: 'Hydroxide ion', color: COLOUR.oxygen },
]
const acidity = { left: 'more acidic', right: 'less acidic' }
const settleLabels = (sludge: string) => [
  { at: [0.17, TUBE[1] + 0.34, 0] as Vec, text: 'Sodium hydroxide' },
  { at: [R + 0.1, 1.0, 0] as Vec, text: 'Still dissolved' },
  { at: [R + 0.1, 0.16, 0] as Vec, text: sludge },
]

// ───────────────────────────── Figure 2: clearing out the impurities ─────────────────────────────

const IMPURITY_COUNT: Record<Metal, number> = { iron: 10, aluminium: 14, nickel: 16, cobalt: 10, manganese: 10, lithium: 12 }

export function ImpurityFigure() {
  const [pH, setPH] = useState(IMPURITY_PH[0])
  const beads = useMemo(() => settleBeads(IMPURITY_COUNT, METALS, settled, (m) => COLOUR[m], IMPURITY_PH, 20, 20, IMPURITY_PH[1]), [])
  return (
    <Frame
      view={
        <Stage label={`A beaker of dissolved battery metals at pH ${pH.toFixed(1)}`} labels={settleLabels('Settled: sludge')}>
          <Beads beads={beads} value={pH} />
        </Stage>
      }
      chart={
        <Chart
          label="Share of each metal still dissolved, against how acidic the solution is"
          series={METALS.map((m) => ({ name: m, color: COLOUR[m], y: (x) => 100 - settled(m, x) }))}
          range={IMPURITY_PH} ticks={[1, 2, 3, 4, 5]} left="more acidic" right="less acidic (pH)" value={pH}
        />
      }
      keyTitle="Share still dissolved"
      keys={[...METALS.map((m) => ({ name: NAME[m], color: COLOUR[m], note: pct(100 - settled(m, pH)) })), ...ION_KEYS]}
      readouts={[
        { name: 'Impurities removed', value: pct((settled('iron', pH) + settled('aluminium', pH)) / 2) },
        { name: 'Nickel lost with them', value: pct(settled('nickel', pH)) },
        { name: 'Cobalt lost with them', value: pct(settled('cobalt', pH)) },
      ]}
      equations={['H⁺ + OH⁻ → H₂O', 'Fe³⁺ + 3 OH⁻ → Fe(OH)₃ (solid)', 'Al³⁺ + 3 OH⁻ → Al(OH)₃ (solid)']}
      slider={{ ...acidity, text: `pH ${pH.toFixed(1)}`, min: IMPURITY_PH[0], max: IMPURITY_PH[1], step: 0.05, value: pH, set: setPH, label: 'Acidity (pH)' }}
      caption={
        <>
          Measured by Chernyaev, Wilson &amp; Lundström (2021), Scientific Reports 11, 23283, CC BY 4.0. The nickel, cobalt and lithium that sink here
          are dragged down with the sludge. Each step up in pH means ten times fewer hydrogen ions; the bead counts are illustrative. Copper is
          removed in an earlier step.
        </>
      }
    />
  )
}

// ───────────────────────────── Figure 3: the valuable metals ─────────────────────────────

const MIXED_COUNT: Record<MixedMetal, number> = { nickel: 16, cobalt: 10, manganese: 10, lithium: 12 }

export function MixedFigure() {
  const [pH, setPH] = useState(MIXED_PH[0])
  const beads = useMemo(() => settleBeads(MIXED_COUNT, MIXED_METALS, settledMixed, (m) => COLOUR[m], MIXED_PH, 3, 27, 6.6), [])
  return (
    <Frame
      view={
        <Stage label={`A beaker of nickel, cobalt, manganese and lithium in solution at pH ${pH.toFixed(1)}`} labels={settleLabels('Settled: mixed metals')}>
          <Beads beads={beads} value={pH} />
        </Stage>
      }
      chart={
        <Chart
          label="Share of each metal still dissolved, against how acidic the solution is"
          series={MIXED_METALS.map((m) => ({ name: m, color: COLOUR[m], y: (x) => 100 - settledMixed(m, x) }))}
          range={MIXED_PH} ticks={[6, 7, 8, 9, 10]} left="more acidic" right="less acidic (pH)" value={pH}
        />
      }
      keyTitle="Share still dissolved"
      keys={[...MIXED_METALS.map((m) => ({ name: NAME[m], color: COLOUR[m], note: pct(100 - settledMixed(m, pH)) })), ...ION_KEYS]}
      readouts={[
        { name: 'Nickel settled', value: pct(settledMixed('nickel', pH)) },
        { name: 'Cobalt settled', value: pct(settledMixed('cobalt', pH)) },
        { name: 'Manganese settled', value: pct(settledMixed('manganese', pH)) },
      ]}
      equations={['Ni²⁺ + 2 OH⁻ → Ni(OH)₂ (solid)', 'Co²⁺ + 2 OH⁻ → Co(OH)₂ (solid)', 'Mn²⁺ + 2 OH⁻ → Mn(OH)₂ (solid)', 'Lithium hydroxide dissolves, so lithium stays in the liquid']}
      slider={{ ...acidity, text: `pH ${pH.toFixed(1)}`, min: MIXED_PH[0], max: MIXED_PH[1], step: 0.05, value: pH, set: setPH, label: 'Acidity (pH)' }}
      caption={
        <>
          Calculated, not measured: from how little of each metal hydroxide can stay dissolved (solubility constants from Martell &amp; Smith, 1976),
          for a solution like leached NMC battery waste (Chernyaev et al., 2023) after the impurities have been filtered off. Real solutions are
          messier: the metals drag each other down. Bead counts are illustrative.
        </>
      }
    />
  )
}

