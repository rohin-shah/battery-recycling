import { useMemo, useState } from 'react'
import { IMPURITY_PH, METALS, MIXED_METALS, MIXED_PH, settled, settledMixed, type Metal, type MixedMetal } from './data'
import { Chart, Frame } from './Frame'
import { COLOUR, drift, inTube, pile, R, TUBE, type Vec } from './layout'
import { setSharedPH, useSharedPH } from './ph'
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

// ───────────────────────────── Figure 1: making an acid, and a metal oxide dissolving in it ─────────────────────────────

/**
 * Illustrative, not measured. Sulfuric acid molecules go into water and split into two hydrogen ions and a sulfate;
 * a small grain of metal oxide sits on the bottom. The oxide only gives way in strong acid: Chen & Ho (2018) dissolved
 * battery cathode powder in 0.25 to 2 mol/L sulfuric acid, roughly pH 0.5 and below.
 */
const ACID_PH: [number, number] = [0, 7]
const MOLECULES = 12 // sulfuric acid molecules in the tube
const OXIDES = 8 // metal–oxygen pairs in the grain
const DISSOLVES_FROM = 2 // pH at which the first pair gives way
const SULFATE = 0.075
const COLOUR_METAL = '#4fb3a9'
const COLOUR_SULFATE = '#e0b84a'

/** pH at which molecule `m` goes into the water: evenly spread from water (pH 7) to strong acid (pH 0). */
const addedAt = (m: number) => ACID_PH[1] - ((m + 0.5) / MOLECULES) * (ACID_PH[1] - ACID_PH[0])
/** pH at which oxide pair `j` dissolves: the top layer first. */
const dissolvesAt = (j: number) => DISSOLVES_FROM - ((j + 0.5) / OXIDES) * DISSOLVES_FROM

/** A small block of metal and oxygen on the beaker floor, 4 × 2 × 2, alternating like a salt crystal. */
function grainSites() {
  const s = 0.15
  const metals: Vec[] = []
  const oxygens: Vec[] = []
  for (let iy = 1; iy >= 0; iy--)
    for (let iz = 0; iz < 2; iz++)
      for (let ix = 0; ix < 4; ix++) {
        const p: Vec = [(ix - 1.5) * s, 0.14 + iy * s, (iz - 0.5) * s]
        ;((ix + iy + iz) % 2 ? oxygens : metals).push(p)
      }
  return { metals, oxygens }
}

/** Place `m` in the dosing tube: three molecules to a ring. */
function tubeSlot(m: number): Vec {
  const a = (m % 3) * ((Math.PI * 2) / 3) + Math.floor(m / 3) * 0.6
  return [TUBE[0] + Math.cos(a) * 0.075, TUBE[1] + 0.1 + Math.floor(m / 3) * 0.12, TUBE[2] + Math.sin(a) * 0.075]
}
const H_ON_SULFATE: Vec[] = [[0.075, 0.03, 0], [-0.075, 0.03, 0]]

function acidBeads(): Bead[] {
  const { metals, oxygens } = grainSites()
  const O = OXIDES // index of the first oxygen
  const S = OXIDES * 2 // index of the first sulfate
  const gone = (j: number, pH: number) => pH <= dissolvesAt(j)
  return [
    ...metals.map((p, j): Bead => ({
      size: METAL,
      aim: (pH) => (gone(j, pH) ? { to: drift(j, 3), jig: 0.035, color: COLOUR_METAL } : { to: p, color: COLOUR_METAL }),
    })),
    ...oxygens.map((p, j): Bead => ({
      size: OXYGEN,
      aim: (pH) => (gone(j, pH) ? { to: drift(j, 7), jig: 0.03, color: COLOUR.oxygen } : { to: p, color: COLOUR.oxygen }),
    })),
    // Sulfate: in the tube as part of a molecule, then loose in the water.
    ...Array.from({ length: MOLECULES }, (_, m): Bead => ({
      size: SULFATE,
      aim: (pH) => (pH <= addedAt(m) ? { to: drift(m, 13), jig: 0.04, color: COLOUR_SULFATE } : { to: tubeSlot(m), color: COLOUR_SULFATE }),
    })),
    // Hydrogen: on its sulfate in the tube; split off as a loose ion in the water; then, for the first pairs, taken by an
    // oxygen of the grain to make water.
    ...Array.from({ length: MOLECULES * 2 }, (_, k): Bead => {
      const m = Math.floor(k / 2)
      return {
        size: HYDROGEN,
        aim: (pH) => {
          if (m < OXIDES && gone(m, pH)) return { on: O + m, offset: ON_OXYGEN[k % 2], color: COLOUR.hydrogen }
          if (pH <= addedAt(m)) return { to: drift(k, 17), jig: 0.07, color: COLOUR.hydrogenIon }
          return { on: S + m, offset: H_ON_SULFATE[k % 2], color: COLOUR.hydrogenIon }
        },
      }
    }),
    ...water(6, 21, S + MOLECULES + MOLECULES * 2),
  ]
}

export function DissolveFigure() {
  const [pH, setPH] = useState(ACID_PH[1])
  const beads = useMemo(() => acidBeads(), [])
  const added = Array.from({ length: MOLECULES }, (_, m) => pH <= addedAt(m)).filter(Boolean).length
  const dissolved = Array.from({ length: OXIDES }, (_, j) => pH <= dissolvesAt(j)).filter(Boolean).length
  return (
    <Frame
      view={
        <Stage
          label={`A grain of metal oxide in water${added ? ` with ${added} molecules of sulfuric acid added, pH ${pH.toFixed(1)}` : ''}`}
          zoomIn={1.45} focus={1.15}
          labels={[
            { at: [0.2, TUBE[1] + 0.42, 0], text: 'Sulfuric acid' },
            { at: [R + 0.1, 1.0, 0], text: 'Water' },
            { at: [R + 0.1, 0.2, 0], text: 'Metal oxide' },
          ]}
        >
          <Beads beads={beads} value={pH} />
        </Stage>
      }
      keys={[
        { name: 'Metal', color: COLOUR_METAL },
        { name: 'Oxygen', color: COLOUR.oxygen },
        { name: 'Hydrogen ion', color: COLOUR.hydrogenIon },
        { name: 'Sulfate', color: COLOUR_SULFATE },
        { name: 'Hydrogen in water', color: COLOUR.hydrogen },
      ]}
      readouts={[
        { name: 'pH', value: pH.toFixed(1) },
        { name: 'Loose hydrogen ions', value: String(added * 2 - dissolved * 2) },
        { name: 'Metal dissolved', value: `${dissolved} of ${OXIDES}` },
      ]}
      equations={[
        'Sulfuric acid splits up in water: H₂SO₄ → 2 H⁺ + SO₄²⁻',
        'metal oxide + hydrogen ions → dissolved metal + water',
        'MO + 2 H⁺ → M²⁺ + H₂O',
      ]}
      slider={{
        left: 'more acidic', right: 'less acidic', text: pH >= ACID_PH[1] ? 'pH 7, plain water' : `pH ${pH.toFixed(1)}`,
        min: ACID_PH[0], max: ACID_PH[1], step: 0.05, value: pH, set: setPH, label: 'Acidity (pH)',
      }}
      caption={
        <>
          Illustrative. Each step down in pH means ten times more hydrogen ions, so the bead counts are not to scale. The metal oxide only gives way in
          strong acid: Chen &amp; Ho (2018) dissolved battery cathode powder in 0.25 to 2 mol/L sulfuric acid, around pH 0.5 and below.
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
const clamp = (v: number, [lo, hi]: [number, number]) => Math.min(hi, Math.max(lo, v))
/** Figures 2 and 3 share one pH scale; each slider shows the whole scale and the part it covers. */
const shared = (step: 1 | 2) => ({
  track: [IMPURITY_PH[0], MIXED_PH[1]] as [number, number],
  steps: [
    { from: IMPURITY_PH[0], to: IMPURITY_PH[1], text: 'Clearing the impurities', active: step === 1 },
    { from: MIXED_PH[0], to: MIXED_PH[1], text: 'Recovering the metals', active: step === 2 },
  ],
})
const settleLabels = (sludge: string) => [
  { at: [0.17, TUBE[1] + 0.34, 0] as Vec, text: 'Sodium hydroxide' },
  { at: [R + 0.1, 1.0, 0] as Vec, text: 'Still dissolved' },
  { at: [R + 0.1, 0.16, 0] as Vec, text: sludge },
]

// ───────────────────────────── Figure 2: clearing out the impurities ─────────────────────────────

const IMPURITY_COUNT: Record<Metal, number> = { iron: 10, aluminium: 14, nickel: 16, cobalt: 10, manganese: 10, lithium: 12 }

export function ImpurityFigure() {
  const pH = clamp(useSharedPH(), IMPURITY_PH)
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
      slider={{ ...acidity, text: `pH ${pH.toFixed(1)}`, min: IMPURITY_PH[0], max: IMPURITY_PH[1], step: 0.05, value: pH, set: setSharedPH, label: 'Acidity (pH)', ...shared(1) }}
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
  const pH = clamp(useSharedPH(), MIXED_PH)
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
      slider={{ ...acidity, text: `pH ${pH.toFixed(1)}`, min: MIXED_PH[0], max: MIXED_PH[1], step: 0.05, value: pH, set: setSharedPH, label: 'Acidity (pH)', ...shared(2) }}
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

