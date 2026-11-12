import { useMemo, useState } from 'react'
import { IMPURITY_PH, METALS, MIXED_METALS, MIXED_PH, settled, settledMixed, type Metal, type MixedMetal } from './data'
import { clickSteps } from './click'
import { Chart, Frame } from './Frame'
import { COLOUR, drift, pile, tipped, TUBE, type Vec } from './layout'
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
      aim: (a) => (a >= addedAt(m) ? { to: wide(drift(m, 13)), jig: 0.05, color: COLOUR.sulfate } : { to: tubeSlot(m, a), color: COLOUR.sulfate }),
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

/** How many hydroxide ions each metal takes when it settles as a solid hydroxide (its charge as an ion). */
const VALENCE: Record<string, number> = { iron: 3, aluminium: 3, nickel: 2, cobalt: 2, manganese: 2, lithium: 1 }
const SODIUM = 0.06
/** Where hydroxide `i` of `n` sits on a settled metal: either side for two, a triangle for three. Face on, so all show. */
const onMetal = (n: number, i: number): Vec => {
  const a = Math.PI / 2 + (i / n) * Math.PI * 2 + (n === 2 ? Math.PI / 2 : 0)
  return [Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0]
}
/** Where the sodium sits on its hydroxide in the vial: sodium hydroxide, NaOH. */
const NA_ON_OH: Vec = [0, -0.085, 0]

/** Slot `k` in the dosing vial: four sodium hydroxide units to a ring, turned with the vial. */
function vialSlot(k: number, progress: number): Vec {
  const ring = Math.floor(k / 4)
  const a = (k % 4) * (Math.PI / 2) + ring * 0.5
  return tipped([TUBE[0] + Math.cos(a) * 0.085, TUBE[1] + 0.09 + ring * 0.12, TUBE[2] + Math.sin(a) * 0.085], progress)
}

/**
 * Ions swapping partners as sodium hydroxide goes in. The vial holds sodium hydroxide; each unit that leaves splits
 * into a sodium ion, which just drifts, and a hydroxide ion with a job. The first hydroxides each meet a hydrogen ion
 * and become water. Then, as each metal ion settles (when the measured or calculated share says it should), as many
 * hydroxides as its charge come and bind to it, and it drops to the bottom as a solid hydroxide. Sulfate ions from the
 * acid drift throughout and never react: sodium and sulfate are what is left, as sodium sulfate solution. Few beads, so
 * each one can be followed.
 */
function settleScene<M extends string>(
  counts: Record<M, number>, order: M[], share: (m: M, pH: number) => number,
  range: [number, number], hydrogenIons: number, sulfates: number, neutralAt: number,
) {
  const ks = (from: number, to: number) => Array.from({ length: Math.max(0, to - from) }, (_, i) => from + i)
  const metals = metalBeads(counts, order)
  const n = metals.length
  const at = firstMove(metals, share, range)
  const slot = new Array<number>(n)
  metals.map((_, i) => i).sort((a, b) => at[a] - at[b] || a - b).forEach((i, s) => (slot[i] = s))
  const colour = (j: number) => COLOUR[metals[j].metal as keyof typeof COLOUR]
  const valence = (j: number) => VALENCE[metals[j].metal]
  // Every hydroxide's job, in the order they leave the vial: meet hydrogen ion `ion`, or bind to metal bead `metal`.
  type Job = { pH: number; ion?: number; metal?: number; place?: number }
  const jobs: Job[] = [
    ...ks(0, hydrogenIons).map((i) => ({ pH: range[0] + ((i + 0.5) / hydrogenIons) * (neutralAt - range[0]), ion: i })),
    ...ks(0, n)
      .filter((j) => Number.isFinite(at[j]))
      .flatMap((j) => ks(0, valence(j)).map((place) => ({ pH: at[j], metal: j, place }))),
  ].sort((a, b) => a.pH - b.pH)
  const N = jobs.length
  const meets = (i: number) => jobs.findIndex((job) => job.ion === i)
  const out = (k: number, pH: number) => pH >= jobs[k].pH
  const tilt = (pH: number) => (pH - range[0]) / (range[1] - range[0])
  // Bead order: metal ions, hydrogen ions, hydroxide oxygens, their hydrogens, sodium ions, sulfate ions, water.
  const H = n
  const OH = H + hydrogenIons
  const NA = OH + N * 2
  const SO = NA + N
  const W = SO + sulfates
  const beads: Bead[] = [
    ...ks(0, n).map((j): Bead => ({
      size: METAL,
      aim: (pH) => (pH >= at[j] ? { to: pile(slot[j]), color: colour(j), speed: 1.6 } : { to: drift(j), jig: 0.06, color: colour(j) }),
    })),
    ...ks(0, hydrogenIons).map((i): Bead => ({
      size: HYDROGEN_ION,
      aim: (pH) =>
        out(meets(i), pH)
          ? { on: OH + meets(i), offset: ON_OXYGEN[1], color: COLOUR.hydrogen, speed: 1.4 }
          : { to: drift(i, 31), jig: 0.32, pace: 1.7, color: COLOUR.hydrogenIon, speed: 2 },
    })),
    ...ks(0, N).map((k): Bead => ({
      size: OXYGEN,
      aim: (pH) => {
        const job = jobs[k]
        if (!out(k, pH)) return { to: vialSlot(k, tilt(pH)), color: COLOUR.oxygen }
        if (job.metal !== undefined) return { on: job.metal, offset: onMetal(valence(job.metal), job.place ?? 0), color: COLOUR.oxygen, speed: 1.4 }
        return { to: drift(k, 41), jig: 0.06, color: COLOUR.oxygen, speed: 1.6 }
      },
    })),
    ...ks(0, N).map((k): Bead => ({ size: HYDROGEN, aim: () => ({ on: OH + k, offset: ON_OXYGEN[0], color: COLOUR.hydrogen }) })),
    ...ks(0, N).map((k): Bead => ({
      size: SODIUM,
      aim: (pH) =>
        out(k, pH) ? { to: drift(k, 51), jig: 0.2, pace: 1.2, color: COLOUR.sodium, speed: 1.6 } : { on: OH + k, offset: NA_ON_OH, color: COLOUR.sodium },
    })),
    ...ks(0, sulfates).map((s): Bead => ({ size: SULFATE, aim: () => ({ to: drift(s, 61), jig: 0.05, color: COLOUR.sulfate }) })),
    ...water(2, 21, W),
  ]

  /**
   * Tags that ride with one bead of each kind, saying what it is at that moment: the sodium hydroxide still in the
   * vial, the newest sodium ion, a sulfate ion, the hydrogen ion due to be met next, the newest water made, the newest
   * hydroxide on its way to a metal, a background water molecule, and each named metal ion until it settles; settled
   * metals share one tag on the pile.
   */
  const tags = (pH: number, named: M[], name: (m: M) => string): Follow[] => {
    const inVial = ks(0, N).find((k) => !out(k, pH))
    const lastOut = (test: (job: Job) => boolean) => ks(0, N).reverse().find((k) => out(k, pH) && test(jobs[k]))
    const sodium = lastOut(() => true)
    const made = lastOut((job) => job.ion !== undefined)
    const binding = lastOut((job) => job.metal !== undefined)
    const ion = ks(0, hydrogenIons).find((i) => !out(meets(i), pH))
    const of = (m: M) => ks(0, n).filter((b) => metals[b].metal === m).sort((a, b) => at[a] - at[b])
    const first = (m: M) => of(m)[0]
    const stillIn = (m: M) => of(m).find((b) => pH < at[b])
    const down = named.filter((m) => pH >= at[first(m)])
    const settledText = down.length === 1 ? `Settled: ${name(down[0]).toLowerCase()} hydroxide` : `Settled as hydroxides: ${list(down.map((m) => name(m).toLowerCase()))}`
    return [
      { id: 'vial', bead: OH + (inVial ?? 0), text: inVial === undefined ? null : 'Sodium hydroxide' },
      { id: 'sodium', bead: NA + (sodium ?? 0), text: sodium === undefined ? null : 'Sodium ion' },
      { id: 'sulfate', bead: SO, text: 'Sulfate ion', below: true },
      { id: 'ion', bead: H + (ion ?? 0), text: ion === undefined ? null : 'Hydrogen ion' },
      { id: 'new water', bead: OH + (made ?? 0), text: made === undefined ? null : 'New water' },
      // A hydroxide is named while it travels to its metal, then becomes part of the solid's tag.
      { id: 'hydroxide', bead: OH + (binding ?? 0), text: binding !== undefined && pH < jobs[binding].pH + 0.25 ? 'Hydroxide ion' : null },
      { id: 'water', bead: W, text: 'Water', below: true },
      // Each named metal's tag stays on one of its beads still dissolved, if any.
      ...named.map((m, i): Follow => {
        const j = stillIn(m)
        return { id: m, bead: j ?? first(m), text: j === undefined ? null : `${name(m)} ion`, below: i % 2 === 1 }
      }),
      { id: 'settled', bead: first(down[0] ?? named[0]), text: down.length ? settledText : null },
    ]
  }
  /** Slider values where something happens: a hydroxide leaves the vial, or a metal settles. */
  const steps = [
    { points: jobs.map((job) => job.pH), pitch: 1000 },
    { points: at.filter(Number.isFinite), pitch: 440 },
  ]
  return { beads, tags, steps }
}

/** 'a', 'a and b', 'a, b and c'. */
const list = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)

const ION_KEYS = [
  { name: 'Hydrogen ion', color: COLOUR.hydrogenIon },
  { name: 'Hydroxide ion', color: COLOUR.oxygen },
  { name: 'Sodium ion', color: COLOUR.sodium },
  { name: 'Sulfate ion', color: COLOUR.sulfate },
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

// ───────────────────────────── Figure 2: clearing out the impurities ─────────────────────────────

const IMPURITY_COUNT: Record<Metal, number> = { iron: 1, aluminium: 1, nickel: 2, cobalt: 1, manganese: 1, lithium: 1 }

export function ImpurityFigure() {
  const pH = clamp(useSharedPH(), IMPURITY_PH)
  const scene = useMemo(() => settleScene(IMPURITY_COUNT, METALS, settled, IMPURITY_PH, 2, 3, IMPURITY_PH[1]), [])
  const setPH = (v: number) => {
    clickSteps(scene.steps, pH, clamp(v, IMPURITY_PH))
    setSharedPH(v)
  }
  return (
    <Frame
      view={
        <Stage label={`Dissolved battery metals at pH ${pH.toFixed(1)}`} vessel="tank" focus={0.95} shift={0.25} labels={[]} progress={share(pH, IMPURITY_PH)}>
          <Beads beads={scene.beads} value={pH} follow={scene.tags(pH, ['iron', 'aluminium', 'nickel'], (m) => NAME[m])} />
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
      equations={['NaOH → Na⁺ + OH⁻', 'H⁺ + OH⁻ → H₂O', 'Fe³⁺ + 3 OH⁻ → Fe(OH)₃ (solid)', 'Al³⁺ + 3 OH⁻ → Al(OH)₃ (solid)', 'Na⁺ and SO₄²⁻ stay dissolved']}
      slider={{ ...acidity, text: `pH ${pH.toFixed(1)}`, min: IMPURITY_PH[0], max: IMPURITY_PH[1], step: 0.05, value: pH, set: setPH, label: 'Acidity (pH)', ...shared(1) }}
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

const MIXED_COUNT: Record<MixedMetal, number> = { nickel: 2, cobalt: 1, manganese: 1, lithium: 1 }

export function MixedFigure() {
  const pH = clamp(useSharedPH(), MIXED_PH)
  const scene = useMemo(() => settleScene(MIXED_COUNT, MIXED_METALS, settledMixed, MIXED_PH, 1, 2, 6.6), [])
  const setPH = (v: number) => {
    clickSteps(scene.steps, pH, clamp(v, MIXED_PH))
    setSharedPH(v)
  }
  return (
    <Frame
      view={
        <Stage label={`Nickel, cobalt, manganese and lithium in solution at pH ${pH.toFixed(1)}`} vessel="tank" focus={0.95} shift={0.25} labels={[]} progress={share(pH, MIXED_PH)}>
          <Beads beads={scene.beads} value={pH} follow={scene.tags(pH, MIXED_METALS, (m) => NAME[m])} />
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
      equations={['Ni²⁺ + 2 OH⁻ → Ni(OH)₂ (solid)', 'Co²⁺ + 2 OH⁻ → Co(OH)₂ (solid)', 'Mn²⁺ + 2 OH⁻ → Mn(OH)₂ (solid)', 'Lithium hydroxide dissolves, so lithium stays in the liquid', 'Na⁺ and SO₄²⁻ stay dissolved: the waste water is sodium sulfate solution']}
      slider={{ ...acidity, text: `pH ${pH.toFixed(1)}`, min: MIXED_PH[0], max: MIXED_PH[1], step: 0.05, value: pH, set: setPH, label: 'Acidity (pH)', ...shared(2) }}
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
