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
} as const
