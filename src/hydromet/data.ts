/**
 * Sourced data behind the three hydrometallurgy figures. Every number here is either measured (read from a published
 * chart or table) or calculated from published constants; the comments say which.
 */

/** Straight-line interpolation through [x, y] points, held flat outside them. */
export function interpolate(points: readonly (readonly [number, number])[], x: number): number {
  if (x <= points[0][0]) return points[0][1]
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i]
    if (x <= x1) {
      const [x0, y0] = points[i - 1]
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
    }
  }
  return points[points.length - 1][1]
}

// ───────────────────────────── Figure 1: dissolving ─────────────────────────────

/**
 * % of each metal dissolved out of NMC cathode powder against sulfuric acid strength (mol/L), with 10% hydrogen
 * peroxide, 120 minutes, 25 °C. Measured by Chen & Ho (2018), Metals 8, 321, Fig. 3a, CC BY 4.0. The cobalt values at
 * 0.25 and 2.0 M and the 2.0 M values for the others are stated in the text; the rest are read off the chart, about
 * ±2 points. Below 0.25 M nothing was measured: the line is drawn straight to zero at no acid.
 */
export type LeachMetal = 'lithium' | 'nickel' | 'cobalt' | 'manganese'
export const LEACH_METALS: LeachMetal[] = ['lithium', 'nickel', 'cobalt', 'manganese']
export const ACID_MIN = 0
export const ACID_MAX = 2
export const ACID_MEASURED_FROM = 0.25

const LEACHED: Record<LeachMetal, [number, number][]> = {
  lithium: [[0, 0], [0.25, 50], [0.5, 76], [1, 92.5], [2, 94.0]],
  nickel: [[0, 0], [0.25, 65], [0.5, 80], [1, 90], [2, 91.4]],
  cobalt: [[0, 0], [0.25, 43.7], [0.5, 71], [1, 91], [2, 91.6]],
  manganese: [[0, 0], [0.25, 64], [0.5, 80], [1, 90], [2, 91.8]],
}

/** % of a metal dissolved at an acid strength (mol/L). */
export const leached = (metal: LeachMetal, acid: number) => interpolate(LEACHED[metal], acid)

// ───────────────────────────── Figure 2: clearing out the impurities ─────────────────────────────

/**
 * % of each metal that has settled out of a battery leach solution as it is made less acidic with sodium hydroxide at
 * 60 °C. Measured by Chernyaev, Wilson & Lundström (2021), Scientific Reports 11, 23283, Fig. 1b (4 g/L aluminium),
 * CC BY 4.0; values read off the chart, about ±2 points. Below pH 3 nothing has settled (precipitation starts at
 * about pH 3: Chernyaev et al. 2023).
 */
export type Metal = 'iron' | 'aluminium' | 'nickel' | 'cobalt' | 'manganese' | 'lithium'
export const METALS: Metal[] = ['iron', 'aluminium', 'nickel', 'cobalt', 'manganese', 'lithium']
export const IMPURITY_PH: [number, number] = [1, 5.5]

const SETTLED: [number, Record<Metal, number>][] = [
  [3.0, { iron: 0, aluminium: 0, nickel: 0, cobalt: 0, manganese: 0, lithium: 0 }],
  [3.5, { iron: 19, aluminium: 10, nickel: 3, cobalt: 1, manganese: 2, lithium: 5 }],
  [4.0, { iron: 97.5, aluminium: 98.5, nickel: 9, cobalt: 2, manganese: 4, lithium: 10 }],
  [4.5, { iron: 99, aluminium: 100, nickel: 28, cobalt: 4.5, manganese: 1.5, lithium: 7.5 }],
  [5.0, { iron: 99, aluminium: 100, nickel: 43, cobalt: 7.5, manganese: 1.5, lithium: 4.5 }],
  [5.5, { iron: 99.5, aluminium: 100, nickel: 57, cobalt: 25, manganese: 2, lithium: 1 }],
]

/** % of a metal settled out at a pH during impurity removal. */
export const settled = (metal: Metal, pH: number) =>
  interpolate(
    SETTLED.map(([p, v]) => [p, v[metal]] as const),
    pH,
  )

// ───────────────────────────── Figure 3: the valuable metals ─────────────────────────────

/**
 * % of nickel, cobalt and manganese settled out as hydroxides when the filtered solution is made alkaline. Calculated,
 * not measured: a metal hydroxide M(OH)2 stays dissolved only while [M][OH]² is below its solubility product, so the
 * dissolved amount is Ksp / [OH]², capped at what was there to begin with. 25 °C; ignores the metals dragging each
 * other down. Lithium hydroxide is soluble, so lithium stays dissolved throughout.
 *
 * Solubility products (log10 Ksp): Martell & Smith, Critical Stability Constants, vol. 4 (1976).
 * Starting concentrations (g/L): Chernyaev et al. (2023), Scientific Reports, doi:10.1038/s41598-023-48247-6, Table 2 (a synthetic solution
 * made to mimic leached NMC battery waste).
 */
export type MixedMetal = 'nickel' | 'cobalt' | 'manganese' | 'lithium'
export const MIXED_METALS: MixedMetal[] = ['nickel', 'cobalt', 'manganese', 'lithium']
export const MIXED_PH: [number, number] = [5.5, 10.5]

const HYDROXIDE: Record<Exclude<MixedMetal, 'lithium'>, { logKsp: number; gPerL: number; gPerMol: number }> = {
  nickel: { logKsp: -15.2, gPerL: 11, gPerMol: 58.69 },
  cobalt: { logKsp: -14.9, gPerL: 5, gPerMol: 58.93 },
  manganese: { logKsp: -12.8, gPerL: 11, gPerMol: 54.94 },
}

/** % of a metal settled out as its hydroxide at a pH. */
export function settledMixed(metal: MixedMetal, pH: number): number {
  if (metal === 'lithium') return 0
  const { logKsp, gPerL, gPerMol } = HYDROXIDE[metal]
  const hydroxide = 10 ** (pH - 14) // mol/L
  const stillDissolved = Math.min(1, 10 ** logKsp / hydroxide ** 2 / (gPerL / gPerMol))
  return 100 * (1 - stillDissolved)
}
