/**
 * One colour per concept across the whole page, matching the CSS variables in index.css.
 * Violet is energy spent (process emissions); lime is what comes back (recovered material, credits).
 */
export const ENCODING = {
  casing: '#7cb4b8', // teal: aluminium and steel housing
  cell: '#acb876', // sage: cells and modules
  blackMass: '#2b302c', // near-black: shredded electrode material
  recovered: '#9bc53d', // lime: recovered salts and metals
  energy: '#4e4187', // violet: heat, electricity, reagents
  ground: '#285943', // forest: net result
  // Elements and salts take their real-world colours: nickel sulphate is green, cobalt sulphate rose, manganese sulphate pale pink.
  nickel: '#7fb03a',
  cobalt: '#b4485e',
  manganese: '#e3a6b4',
  lithium: '#d4d4c8', // lithium carbonate is white; a pale grey stays visible on the light figure background
  graphite: '#2b302c',
  aluminium: '#7cb4b8', // teal, as the casing
  copper: '#c27c3e',
  iron: '#9a5b2e',
  steel: '#8a8f95',
  slag: '#c9c6bd',
} as const

export type Ink = keyof typeof ENCODING
