/** Fixed geometry and colours shared by the hydrometallurgy figures. */

export type Vec = [number, number, number]

export const R = 0.9 // beaker inner radius
export const LIQUID_TOP = 1.45
export const TUBE: Vec = [0, 2.1, 0]

/** Bead colours. Metals are stronger than the page palette so they stay distinct on the dark panel. */
export const COLOUR = {
  iron: '#d2601f',
  aluminium: '#f1f4f4',
  nickel: '#3fbf5f',
  cobalt: '#2f6ff0',
  manganese: '#b45ae0',
  lithium: '#f2cf2e',
  oxygen: '#e5483c',
  hydrogenIon: '#ffffff',
  hydrogen: '#9fb1ba', // hydrogen that is part of a water molecule or a hydroxide ion
} as const

export const hash = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** A place to drift in the liquid, fixed for bead `k`. */
export function drift(k: number, salt = 0): Vec {
  const a = hash(k, 1 + salt) * Math.PI * 2
  const r = Math.sqrt(hash(k, 2 + salt)) * (R - 0.16)
  return [Math.cos(a) * r, 0.42 + hash(k, 3 + salt) * (LIQUID_TOP - 0.58), Math.sin(a) * r]
}

/** Slot `s` in a compact pile on the beaker floor, filling from the middle outwards, `perLayer` to a layer. */
export function pile(s: number, perLayer = 36, radius = R - 0.3, lift = 0.13): Vec {
  const a = s * 2.39996
  const r = Math.sqrt(((s % perLayer) + 0.5) / perLayer) * radius
  return [Math.cos(a) * r, 0.15 + Math.floor(s / perLayer) * lift, Math.sin(a) * r]
}

/** Place `n` in the dosing tube, stacked in rings of eight. */
export function inTube(n: number): Vec {
  const ring = Math.floor(n / 8)
  const a = (n % 8) * (Math.PI / 4) + ring * 0.4
  return [TUBE[0] + Math.cos(a) * 0.1, TUBE[1] + 0.06 + ring * 0.066, TUBE[2] + Math.sin(a) * 0.1]
}
