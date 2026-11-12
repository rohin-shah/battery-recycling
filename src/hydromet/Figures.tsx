import { useMemo, useState } from 'react'
import { IMPURITY_PH, interpolate, METALS, sweetSpot, MIXED_METALS, MIXED_PH, settled, settledMixed, type Metal, type MixedMetal } from './data'
import { backlash, thumbAt } from './backlash'
import { clickSteps } from './click'
import { Chart, Frame } from './Frame'
import { COLOUR, drift, tipped, TUBE, type Vec } from './layout'
import { setImpurityPH, setMixedPH, useImpurityPH, useMixedPH } from './ph'
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
const COLOUR_GRAPHITE = '#6b7377'

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

// Bead order: particle cores, their oxygens, sulfates, hydrogens (two per molecule), background water, graphite.
const O = PAIRS
const S = PAIRS * 2
const H = S + MOLECULES
const GRAPHITE = H + MOLECULES * 2 + 6 // after the hydrogens and two background water molecules

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
    // A flake of graphite: a ring of carbon atoms. The acid never touches it, so it never moves.
    ...Array.from({ length: 6 }, (_, i): Bead => {
      const a = (i / 6) * Math.PI * 2
      return { size: 0.055, aim: () => ({ to: [0.62 + Math.cos(a) * 0.12, 0.2 + Math.sin(a) * 0.12, 0], color: COLOUR_GRAPHITE }) }
    }),
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
    { id: 'water', bead: H + MOLECULES * 2, text: 'Water (H₂O)' },
    // Graphite: named as carbon, and once the particle has started to dissolve, called out as untouched.
    { id: 'graphite', bead: GRAPHITE, text: gone(0, a) ? 'Graphite: unchanged' : 'Graphite (carbon)' },
    // The oxygen the text talks about: part of the particle, until the hydrogen ions take it away as new water.
    { id: 'oxygen', bead: O, text: gone(0, a) ? 'New water (H₂O)' : 'Oxygen atom, in the particle' },
    // The particle's tag starts on the piece that comes free first and goes with it, so the reader sees it leave; once
    // free it is named as what it is, a metal ion, matching the text. Only then does the rest of the particle get a tag.
    { id: 'freed', bead: 0, text: gone(0, a) ? 'Metal ion' : 'Soluble particle', below: true },
    { id: 'particle', bead: holding ?? 0, text: gone(0, a) && holding !== undefined ? 'Soluble particle' : null, below: true },
  ]
}

/** The slider values where something happens: a molecule pours in, or a piece of particle comes free. */
const POURS = Array.from({ length: MOLECULES }, (_, m) => addedAt(m))
const FREES = Array.from({ length: PAIRS }, (_, j) => dissolvesAt(j))

export function DissolveFigure() {
  const [acid, setValue] = useState(0)
  const [thumb, setThumb] = useState<number | null>(null)
  const setAcid = (v: number) => {
    setThumb(v)
    const next = backlash(acid, v, [0, 1])
    if (next === acid) return
    clickSteps([{ points: POURS, pitch: 1000 }, { points: FREES, pitch: 440 }], acid, next)
    setValue(next)
  }
  const beads = useMemo(() => acidBeads(), [])
  const added = Array.from({ length: MOLECULES }, (_, m) => acid >= addedAt(m)).filter(Boolean).length
  return (
    <Frame
      view={
        <Stage
          label={`A soluble particle in water, ${added ? `with ${added} molecules of sulfuric acid added` : 'with no acid'}`}
          vessel="tank" focus={0.95} zoomIn={1} progress={acid} labels={[]}
        >
          <Beads beads={beads} value={acid} follow={acidTags(acid)} />
        </Stage>
      }
      slider={{
        left: 'water', right: 'strong acid', text: added ? 'Acid added' : 'Plain water',
        min: 0, max: 1, step: 0.002, value: thumbAt(thumb, acid, [0, 1]), set: setAcid, label: 'Acid added',
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
const BIND = 0.1 // how much lower in pH a metal's hydroxides bind to it than it settles
/** Where hydroxide `i` of `n` sits on a settled metal: either side for two, a triangle for three. Face on, so all show. */
const onMetal = (n: number, i: number): Vec => {
  const a = Math.PI / 2 + (i / n) * Math.PI * 2 + (n === 2 ? Math.PI / 2 : 0)
  return [Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0]
}
/** Where the sodium sits on its hydroxide in the vial: sodium hydroxide, NaOH. */
const NA_ON_OH: Vec = [0, -0.085, 0]

/**
 * Settled solids sit in one row on the floor, face on, so it is plain they have dropped out; what is still dissolved
 * floats higher up (`high`), leaving a clear gap above them.
 */
const onFloor = (s: number, count: number): Vec => [(s - (count - 1) / 2) * 0.3, 0.1, 0]
const high = ([x, y, z]: Vec): Vec => [x, y + 0.3, z]

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
  /** Extra pH values to give their own share of the slider, such as the edges of a window to mark. */
  marks: number[] = [],
  waters = 2,
) {
  const ks = (from: number, to: number) => Array.from({ length: Math.max(0, to - from) }, (_, i) => from + i)
  const metals = metalBeads(counts, order)
  const n = metals.length
  const at = firstMove(metals, share, range)
  const slot = new Array<number>(n)
  metals.map((_, i) => i).sort((a, b) => at[a] - at[b] || a - b).forEach((i, s) => (slot[i] = s))
  const colour = (j: number) => COLOUR[metals[j].metal as keyof typeof COLOUR]
  const settling = at.filter(Number.isFinite).length
  const valence = (j: number) => VALENCE[metals[j].metal]
  // Every hydroxide's job, in the order they leave the vial: meet hydrogen ion `ion`, or bind to metal bead `metal`.
  type Job = { pH: number; ion?: number; metal?: number; place?: number }
  const jobs: Job[] = [
    ...ks(0, hydrogenIons).map((i) => ({ pH: range[0] + ((i + 0.5) / hydrogenIons) * (neutralAt - range[0]), ion: i })),
    ...ks(0, n)
      .filter((j) => Number.isFinite(at[j]))
      .flatMap((j) => ks(0, valence(j)).map((place) => ({ pH: Math.max(range[0], at[j] - BIND), metal: j, place }))),
  ].sort((a, b) => a.pH - b.pH)
  const N = jobs.length
  const meets = (i: number) => jobs.findIndex((job) => job.ion === i)
  /** Bead indices of the hydroxide oxygens that bond to metal bead `j`. */
  const bonders = (j: number) => ks(0, N).filter((k) => jobs[k].metal === j).map((k) => OH + k)
  const out = (k: number, pH: number) => pH >= jobs[k].pH
  // The slider is not linear in pH: every event gets an equal share of its travel, so a metal's hydroxides visibly bind
  // to it (while it is still dissolved) a step before the solid drops, even where events crowd together in pH.
  const knots = [...new Set([...jobs.map((job) => job.pH), ...at.filter(Number.isFinite), ...marks])].filter((v) => v > range[0] && v < range[1]).sort((a, b) => a - b)
  const pHs = [range[0], ...knots, range[1]]
  const positions = pHs.map((_, i) => i / (pHs.length - 1))
  /** Slider position (0 to 1) for a pH, and back. */
  const toPos = (pH: number) => interpolate(pHs.map((v, i) => [v, positions[i]]), pH)
  const fromPos = (pos: number) => interpolate(positions.map((v, i) => [v, pHs[i]]), pos)
  const tilt = toPos
  // Bead order: metal ions, hydrogen ions, hydroxide oxygens, their hydrogens, sodium ions, sulfate ions, water.
  const H = n
  const OH = H + hydrogenIons
  const NA = OH + N * 2
  const SO = NA + N
  const W = SO + sulfates
  const beads: Bead[] = [
    ...ks(0, n).map((j): Bead => ({
      size: METAL,
      // Settles only once its hydroxides have reached it and bonded; until then it holds still where it was.
      aim: (pH) =>
        pH >= at[j]
          ? { to: onFloor(slot[j], settling), color: colour(j), speed: 2.2, wait: { for: bonders(j), hold: high(drift(j)) } }
          : { to: high(drift(j)), jig: 0.06, color: colour(j) },
    })),
    ...ks(0, hydrogenIons).map((i): Bead => ({
      size: HYDROGEN_ION,
      aim: (pH) =>
        out(meets(i), pH)
          ? { on: OH + meets(i), offset: ON_OXYGEN[1], color: COLOUR.hydrogen, speed: 1.4 }
          : { to: high(drift(i, 31)), jig: 0.32, pace: 1.7, color: COLOUR.hydrogenIon, speed: 2 },
    })),
    ...ks(0, N).map((k): Bead => ({
      size: OXYGEN,
      aim: (pH) => {
        const job = jobs[k]
        if (!out(k, pH)) return { to: vialSlot(k, tilt(pH)), color: COLOUR.oxygen }
        if (job.metal !== undefined) return { on: job.metal, offset: onMetal(valence(job.metal), job.place ?? 0), color: COLOUR.oxygen, speed: 2.6 }
        return { to: high(drift(k, 41)), jig: 0.06, color: COLOUR.oxygen, speed: 1.6 }
      },
    })),
    ...ks(0, N).map((k): Bead => ({ size: HYDROGEN, aim: () => ({ on: OH + k, offset: ON_OXYGEN[0], color: COLOUR.hydrogen }) })),
    ...ks(0, N).map((k): Bead => ({
      size: SODIUM,
      aim: (pH) =>
        out(k, pH) ? { to: high(drift(k, 51)), jig: 0.2, pace: 1.2, color: COLOUR.sodium, speed: 1.6 } : { on: OH + k, offset: NA_ON_OH, color: COLOUR.sodium },
    })),
    ...ks(0, sulfates).map((s): Bead => ({ size: SULFATE, aim: () => ({ to: high(drift(s, 61)), jig: 0.05, color: COLOUR.sulfate }) })),
    ...water(waters, 21, W),
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
      { id: 'new water', bead: OH + (made ?? 0), text: made === undefined ? null : 'New water (H₂O)' },
      // A hydroxide is named from leaving the vial until its metal settles; then it is part of the solid's tag.
      { id: 'hydroxide', bead: OH + (binding ?? 0), text: binding !== undefined && pH < at[jobs[binding].metal ?? 0] ? 'Hydroxide ion' : null },
      { id: 'water', bead: W, text: 'Water (H₂O)', below: true },
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
  return { beads, tags, steps, toPos, fromPos }
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
/**
 * Figures 2 and 3 share one slider scale: 0 to 1 is figure 2's stretch and 1 to 2 figure 3's, and figure 3 starts where
 * figure 2 was left (see ph.ts). Each figure maps its stretch to pH in its own way (see `settleScene`).
 */
const shared = { track: [0, 2] as [number, number] }

// ───────────────────────────── Figure 2: clearing out the impurities ─────────────────────────────

/** Where to stop: the whole slider is amber before the sweet spot, green in it and red past it, with a line saying why. */
const SWEET = sweetSpot()
/** Points across the sweet spot, so it gets a good stretch of the slider rather than a sliver. */
const SWEET_MARKS = [0, 1, 2, 3, 4].map((i) => SWEET[0] + (i / 4) * (SWEET[1] - SWEET[0]))
const STAGES = {
  early: { tone: '#f2a33a', note: 'Impurities still dissolved' },
  sweet: { tone: '#9bc53d', note: 'Sweet spot: impurities out, little nickel lost' },
  late: { tone: '#e5483c', note: 'Too far: losing nickel' },
}

const IMPURITY_COUNT: Record<Metal, number> = { iron: 1, aluminium: 1, nickel: 2, cobalt: 1, manganese: 1, lithium: 1 }

export function ImpurityFigure() {
  const pH = clamp(useImpurityPH(), IMPURITY_PH)
  const scene = useMemo(() => settleScene(IMPURITY_COUNT, METALS, settled, IMPURITY_PH, 2, 3, IMPURITY_PH[1], SWEET_MARKS), [])
  const pos = scene.toPos(pH)
  const stage = pH < SWEET[0] ? 'early' : pH <= SWEET[1] ? 'sweet' : 'late'
  const [thumb, setThumb] = useState<number | null>(null)
  const setPos = (v: number) => {
    setThumb(v)
    const shown = backlash(pos, v, [0, 1])
    if (shown === pos) return
    const next = scene.fromPos(shown)
    clickSteps(scene.steps, pH, next)
    setImpurityPH(next)
  }
  return (
    <Frame
      view={
        <Stage label={`Dissolved battery metals at pH ${pH.toFixed(1)}`} vessel="tank" focus={0.8} shift={0} zoomIn={1.6} closeIn={0.45} floor labels={[]} progress={pos}>
          <Beads beads={scene.beads} value={pH} follow={scene.tags(pH, ['iron', 'aluminium', 'nickel'], (m) => NAME[m])} />
        </Stage>
      }
      chart={
        <Chart
          label="Share of each metal still dissolved, against how acidic the solution is"
          series={METALS.map((m) => ({ name: m, color: COLOUR[m], y: (x) => 100 - settled(m, x) }))}
          range={IMPURITY_PH} left="more acidic" right="less acidic (pH)" value={pH} yTitle="Still dissolved" zoom={pos}
          band={{ from: SWEET[0], to: SWEET[1], text: 'sweet spot' }}
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
      slider={{
        ...acidity, text: `pH ${pH.toFixed(1)}`, min: 0, max: 1, step: 0.002, value: thumbAt(thumb, pos, [0, 1]), set: setPos, label: 'Acidity (pH)', ...shared,
        ...STAGES[stage],
      }}
      caption={
        <>
          Measured by Chernyaev, Wilson &amp; Lundström (2021), Scientific Reports 11, 23283, CC BY 4.0. The nickel, cobalt and lithium that sink here
          are dragged down with the sludge. Each step up in pH means ten times fewer hydrogen ions; the bead counts are illustrative. Copper is
          taken out separately, by adding iron, which this figure does not show.
        </>
      }
    />
  )
}

// ───────────────────────────── Figure 3: the valuable metals ─────────────────────────────

const MIXED_COUNT: Record<MixedMetal, number> = { nickel: 1, cobalt: 1, manganese: 1, lithium: 1 }

export function MixedFigure() {
  const pH = clamp(useMixedPH(), MIXED_PH)
  const scene = useMemo(() => settleScene(MIXED_COUNT, MIXED_METALS, settledMixed, MIXED_PH, 1, 1, 6.6, [], 1), [])
  const pos = scene.toPos(pH)
  const [thumb, setThumb] = useState<number | null>(null)
  const setPos = (v: number) => {
    setThumb(v)
    const shown = backlash(1 + pos, v, [1, 2])
    if (shown === 1 + pos) return
    const next = scene.fromPos(shown - 1)
    clickSteps(scene.steps, pH, next)
    setMixedPH(next)
  }
  return (
    <Frame
      view={
        <Stage label={`Nickel, cobalt, manganese and lithium in solution at pH ${pH.toFixed(1)}`} vessel="tank" focus={0.8} shift={0} zoomIn={1.6} closeIn={0.45} floor labels={[]} progress={pos}>
          <Beads beads={scene.beads} value={pH} follow={scene.tags(pH, MIXED_METALS, (m) => NAME[m])} />
        </Stage>
      }
      chart={
        <Chart
          label="Share of each metal still dissolved, against how acidic the solution is"
          series={MIXED_METALS.map((m) => ({ name: m, color: COLOUR[m], y: (x) => 100 - settledMixed(m, x) }))}
          range={MIXED_PH} left="more acidic" right="less acidic (pH)" value={pH} yTitle="Still dissolved" zoom={pos}
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
      slider={{ ...acidity, text: `pH ${pH.toFixed(1)}`, min: 1, max: 2, step: 0.002, value: thumbAt(thumb, 1 + pos, [1, 2]), set: setPos, label: 'Acidity (pH)', ...shared }}
      caption={
        <>
          Calculated, not measured: from how little of each metal hydroxide can stay dissolved (solubility constants from Martell &amp; Smith, 1976),
          for a solution like leached NMC battery waste (Chernyaev et al., 2023) after the impurities have been filtered off. Real solutions are
          messier: the metals drag each other down. Lithium stays dissolved here; it is recovered afterwards with sodium carbonate, which this
          figure does not show. Bead counts are illustrative.
        </>
      }
    />
  )
}
