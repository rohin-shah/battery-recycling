/**
 * Figure A, the impurity window: % of each metal that has settled out of a battery leach solution as it is made less
 * acidic with sodium hydroxide at 60 °C. Measured by Chernyaev, Wilson & Lundström (2021), Scientific Reports 11, 23283,
 * Fig. 1b (4 g/L aluminium), CC BY 4.0; values read off the chart, about ±2 points. Below pH 3 nothing has settled
 * (precipitation starts at about pH 3: Chernyaev et al. 2023).
 */
export type Metal = 'iron' | 'aluminium' | 'nickel' | 'cobalt' | 'manganese' | 'lithium'
export const METALS: Metal[] = ['iron', 'aluminium', 'nickel', 'cobalt', 'manganese', 'lithium']

export const PH_MIN = 1
export const PH_MAX = 5.5

const MEASURED: [number, Record<Metal, number>][] = [
  [3.0, { iron: 0, aluminium: 0, nickel: 0, cobalt: 0, manganese: 0, lithium: 0 }],
  [3.5, { iron: 19, aluminium: 10, nickel: 3, cobalt: 1, manganese: 2, lithium: 5 }],
  [4.0, { iron: 97.5, aluminium: 98.5, nickel: 9, cobalt: 2, manganese: 4, lithium: 10 }],
  [4.5, { iron: 99, aluminium: 100, nickel: 28, cobalt: 4.5, manganese: 1.5, lithium: 7.5 }],
  [5.0, { iron: 99, aluminium: 100, nickel: 43, cobalt: 7.5, manganese: 1.5, lithium: 4.5 }],
  [5.5, { iron: 99.5, aluminium: 100, nickel: 57, cobalt: 25, manganese: 2, lithium: 1 }],
]

/** % of a metal settled out at a pH, interpolated in straight lines between the measured points. */
export function settled(metal: Metal, pH: number): number {
  if (pH <= MEASURED[0][0]) return 0
  for (let i = 1; i < MEASURED.length; i++) {
    const [p1, v1] = MEASURED[i]
    if (pH <= p1) {
      const [p0, v0] = MEASURED[i - 1]
      return v0[metal] + ((v1[metal] - v0[metal]) * (pH - p0)) / (p1 - p0)
    }
  }
  return MEASURED[MEASURED.length - 1][1][metal]
}
