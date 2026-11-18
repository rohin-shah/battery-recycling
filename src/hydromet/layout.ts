/** Fixed geometry and colours shared by the hydrometallurgy figures. */

export type Vec = [number, number, number]

export const R = 0.9 // beaker inner radius
export const LIQUID_TOP = 1.45
export const TUBE: Vec = [0.3, 1.95, 0] // the beaker's mouth, which it tips about; its body hangs below
export const TANK = { w: 2.4, d: 1.6, h: 1.9 } // the aquarium in figure 1

/** Bead colours, built on the page palette (f96304 d5db1e 00b49b 006a5b 9db2cb 6a82a0 3d4d60) and riffs on it, kept distinct from one another on the dark panel. */
export const COLOUR = {
  iron: '#e0457b', // raspberry: rust-red would blur into oxygen's orange on the settled pile
  aluminium: '#9db2cb', // steel: from the palette; silvery, like the metal
  nickel: '#00b49b',
  cobalt: '#4f8fe6',
  manganese: '#a77dd6',
  lithium: '#ffc23d',
  oxygen: '#f96304',
  hydrogenIon: '#d5db1e', // palette lime
  hydrogen: '#d5db1e', // hydrogen in a water molecule or hydroxide ion: the same as a loose hydrogen ion, so it reads as the same atom
  sulfate: '#efe2b8', // cream, clear of iron's raspberry and lithium's amber
  sodium: '#5fd4e8',
  graphite: '#6a82a0',
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

/**
 * The dosing beaker's tilt (radians) for `progress` (0 to 1) along the slider: leaning at 45° at the start, tipping
 * over its mouth as the slider rises, to well past horizontal at the end.
 */
export const tubeAngle = (progress: number) => Math.PI / 4 + (2.4 - Math.PI / 4) * progress // 45° at the start
/** The beaker's height below its mouth. */
export const BEAKER_DEPTH = 0.45
/**
 * A point just beyond the beaker's mouth, along its axis, for the beaker's tilt at `progress`: whatever leaves the
 * beaker heads here first, straight out through the opening, and only then falls.
 */
export function mouth(progress: number): Vec {
  const t = tubeAngle(progress)
  return [TUBE[0] - Math.sin(t) * 0.16, TUBE[1] + Math.cos(t) * 0.16, TUBE[2]]
}

/** A point in the dosing beaker, turned with the beaker about its mouth. */
export function tipped([x, y, z]: Vec, progress: number): Vec {
  const t = tubeAngle(progress)
  const dx = x - TUBE[0]
  const dy = y - TUBE[1]
  return [TUBE[0] + dx * Math.cos(t) - dy * Math.sin(t), TUBE[1] + dx * Math.sin(t) + dy * Math.cos(t), z]
}
