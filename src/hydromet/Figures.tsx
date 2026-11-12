import { useMemo, useState } from 'react'
import { IMPURITY_PH, METALS, MIXED_METALS, MIXED_PH, settled, settledMixed, type Metal, type MixedMetal } from './data'
import { clickSteps } from './click'
import { Chart, Frame } from './Frame'
import { COLOUR, drift, inTube, pile, R, tipped, TUBE, type Vec } from './layout'
import { setSharedPH, useSharedPH } from './ph'
import { type Bead, Beads, type Follow, Stage } from './scene'
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

// ───────────────────────────── Figure 1: making an acid, and a particle dissolving in it ─────────────────────────────

/**
 * Illustrative, not measured. The reader adds sulfuric acid to water, a molecule at a time; each splits into two
 * hydrogen ions and a sulfate. A soluble particle sits on the bottom, and only gives way once the acid is strong: the
 * last stretch of the slider (Chen & Ho 2018 needed 0.25 to 2 mol/L sulfuric acid to dissolve battery cathode powder).
 * Few beads, so each one can be followed.
 */
const MOLECULES = 3 // sulfuric acid molecules in the tube
const PAIRS = 2 // particle–oxygen pairs in the particle; the first PAIRS molecules' hydrogen ions take their oxygens
const DISSOLVES_FROM = 5 / 7 // share of the acid added before the particle starts to give way
const SULFATE = 0.075
const HYDROGEN_ION = 0.042 // drawn larger here, so the reader can follow them
const LAND = 0.025 // how much earlier in the slider's travel the hydrogen ions land on a pair than it comes away
const COLOUR_PARTICLE = '#4fb3a9'
const COLOUR_SULFATE = '#e0b84a'

/** How much acid (0 to 1) is in when molecule `m` goes into the water. */
const addedAt = (m: number) => (m + 0.5) / MOLECULES
/** How much acid is in when pair `j` comes away, one after another. */
const dissolvesAt = (j: number) => DISSOLVES_FROM + ((j + 0.5) / PAIRS) * (1 - DISSOLVES_FROM)
const gone = (j: number, a: number) => a >= dissolvesAt(j)
const taken = (j: number, a: number) => a >= dissolvesAt(j) - LAND

/** The particle on the tank floor, 2 × 2 in one layer, alternating like a salt crystal. */
function particleSites() {
  const s = 0.16
  const cores: Vec[] = []
  const oxygens: Vec[] = []
  for (let iz = 0; iz < 2; iz++)
    for (let ix = 0; ix < 2; ix++) {
      const p: Vec = [(ix - 0.5) * s, 0.14, (iz - 0.5) * s]
      ;((ix + iz) % 2 ? oxygens : cores).push(p)
    }
  return { cores, oxygens }
}

/** Place `m` in the dosing tube: three molecules to a ring. */
function tubeSlot(m: number, progress: number): Vec {
  const a = (m % 3) * ((Math.PI * 2) / 3) + Math.floor(m / 3) * 0.6
  return tipped([TUBE[0] + Math.cos(a) * 0.075, TUBE[1] + 0.1 + Math.floor(m / 3) * 0.12, TUBE[2] + Math.sin(a) * 0.075], progress)
}

/** Spread a drifting place across the tank, which is wider than the beaker. */
const wide = ([x, y, z]: Vec): Vec => [x * 1.25, y, z]
const H_ON_SULFATE: Vec[] = [[0.075, 0.03, 0], [-0.075, 0.03, 0]]

// Bead order: particle cores, their oxygens, sulfates, hydrogens (two per molecule), then background water.
const O = PAIRS
const S = PAIRS * 2
const H = S + MOLECULES

function acidBeads(): Bead[] {
  const { cores, oxygens } = particleSites()
  return [
    ...cores.map((p, j): Bead => ({
      size: METAL,
      aim: (a) => (gone(j, a) ? { to: wide(drift(j, 3)), jig: 0.06, color: COLOUR_PARTICLE, speed: 1.4 } : { to: p, color: COLOUR_PARTICLE }),
    })),
    ...oxygens.map((p, j): Bead => ({
      size: OXYGEN,
      aim: (a) => (gone(j, a) ? { to: wide(drift(j, 7)), jig: 0.06, color: COLOUR.oxygen, speed: 1.4 } : { to: p, color: COLOUR.oxygen }),
    })),
    // Sulfate: in the tube as part of a molecule, then loose in the water.
    ...Array.from({ length: MOLECULES }, (_, m): Bead => ({
      size: SULFATE,
      aim: (a) => (a >= addedAt(m) ? { to: wide(drift(m, 13)), jig: 0.05, color: COLOUR_SULFATE } : { to: tubeSlot(m, a), color: COLOUR_SULFATE }),
    })),
    // Hydrogen: on its sulfate in the tube; split off as an ion roaming the water; then, for the first molecules,
    // swimming over to an oxygen of the particle to make water.
    ...Array.from({ length: MOLECULES * 2 }, (_, k): Bead => {
      const m = Math.floor(k / 2)
      return {
        size: HYDROGEN_ION,
        aim: (a) => {
          if (m < PAIRS && taken(m, a)) return { on: O + m, offset: ON_OXYGEN[k % 2], color: COLOUR.hydrogen, speed: 1.4 }
          if (a >= addedAt(m)) return { to: wide(drift(k, 17)), jig: 0.32, pace: 1.7, color: COLOUR.hydrogenIon, speed: 2 }
          return { on: S + m, offset: H_ON_SULFATE[k % 2], color: COLOUR.hydrogenIon }
        },
      }
    }),
    ...water(2, 21, H + MOLECULES * 2),
  ]
}

/**
 * Tags that ride with one bead of each kind, so everything on screen is named at every point of the slider. Each tag
 * sits on the bead doing the most at that moment: the acid still in the vial; the hydrogen ion due to react next; the
 * first sulfate poured in; a water molecule (and, once one has formed, the new one); the first piece of particle to
 * come free, and the rest of the particle once it has.
 */
function acidTags(a: number): Follow[] {
  const range = (n: number) => Array.from({ length: n }, (_, i) => i)
  const inVial = range(MOLECULES).find((m) => a < addedAt(m))
  const ion = range(MOLECULES).find((m) => a >= addedAt(m) && !(m < PAIRS && gone(m, a)))
  const holding = range(PAIRS).reverse().find((j) => !gone(j, a))
  return [
    { id: 'acid', bead: S + (inVial ?? 0), text: inVial === undefined ? null : 'Acid' },
    { id: 'ion', bead: H + (ion ?? 0) * 2, text: ion === undefined ? null : 'Hydrogen ion' },
    { id: 'sulfate', bead: S, text: a >= addedAt(0) ? 'Sulfate' : null, below: true },
    { id: 'water', bead: H + MOLECULES * 2, text: 'Water' },
    { id: 'new water', bead: O, text: gone(0, a) ? 'New water' : null },
    // The particle's tag starts on the piece that comes free first and goes with it, so the reader sees it leave; only
    // then does the rest of the particle get a tag of its own.
    { id: 'freed', bead: 0, text: gone(0, a) ? 'Dissolved particle' : 'Soluble particle', below: true },
    { id: 'particle', bead: holding ?? 0, text: gone(0, a) && holding !== undefined ? 'Soluble particle' : null, below: true },
  ]
}

/** The slider values where something happens: a molecule pours in, or a piece of particle comes free. */
const POURS = Array.from({ length: MOLECULES }, (_, m) => addedAt(m))
const FREES = Array.from({ length: PAIRS }, (_, j) => dissolvesAt(j))

export function DissolveFigure() {
  const [acid, setValue] = useState(0)
  const setAcid = (v: number) => {
    clickSteps([{ points: POURS, pitch: 1000 }, { points: FREES, pitch: 440 }], acid, v)
    setValue(v)
  }
  const beads = useMemo(() => acidBeads(), [])
  const added = Array.from({ length: MOLECULES }, (_, m) => acid >= addedAt(m)).filter(Boolean).length
  return (
    <Frame
      view={
        <Stage
          label={`A soluble particle in water, ${added ? `with ${added} molecules of sulfuric acid added` : 'with no acid'}`}
          vessel="tank" focus={0.95} progress={acid} labels={[]}
        >
          <Beads beads={beads} value={acid} follow={acidTags(acid)} />
        </Stage>
      }
      slider={{
        left: 'water', right: 'strong acid', text: added ? 'Acid added' : 'Plain water',
        min: 0, max: 1, step: 0.01, value: acid, set: setAcid, label: 'Acid added',
      }}
      caption={
        <>
          Illustrative: real acid has far more hydrogen ions than shown. The particle only gives way once the acid is strong; Chen &amp; Ho (2018) needed
          0.25 to 2 mol/L sulfuric acid to dissolve battery cathode powder.
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
      aim: (pH) => (pH >= release(k) ? { to: drift(k, 41), jig: 0.04, color: COLOUR.oxygen } : { to: inTube(k, (pH - range[0]) / (range[1] - range[0])), color: COLOUR.oxygen }),
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
/** How far through its own range a figure's slider is, 0 to 1. */
const share = (v: number, [lo, hi]: [number, number]) => (v - lo) / (hi - lo)
/** Figures 2 and 3 share one pH scale; each slider shows the whole scale and the part it covers. */
const shared = (step: 1 | 2) => ({
  track: [IMPURITY_PH[0], MIXED_PH[1]] as [number, number],
  steps: [
    { from: IMPURITY_PH[0], to: IMPURITY_PH[1], text: 'Clearing the impurities', active: step === 1 },
    { from: MIXED_PH[0], to: MIXED_PH[1], text: 'Recovering the metals', active: step === 2 },
  ],
})
const settleLabels = (sludge: string) => [
  { at: [0.12, TUBE[1] + 0.12, 0] as Vec, text: 'Sodium hydroxide' },
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
        <Stage label={`A beaker of dissolved battery metals at pH ${pH.toFixed(1)}`} labels={settleLabels('Settled: sludge')} progress={share(pH, IMPURITY_PH)}>
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
        <Stage label={`A beaker of nickel, cobalt, manganese and lithium in solution at pH ${pH.toFixed(1)}`} labels={settleLabels('Settled: mixed metals')} progress={share(pH, MIXED_PH)}>
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

