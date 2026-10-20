import { BASE_GRID, ELECTRICITY, NET, PACK, PRIMARY_FACTOR, RECOVERED, RECOVERY_TOTAL, REGIONS, SUBSTITUTABLE, type Material, type RegionId, type RouteId } from './data'

export type Inputs = { packKwh: number; route: RouteId; region: RegionId; substitution: number }

/** All carbon figures in tonnes CO₂e for the whole pack; process and credit are positive, net = process − credit. */
export type Result = { massKg: number; recoveredKg: number; process: number; credit: number; net: number }

/** shortcut: mass scales linearly from Blömeke's 95 kWh pack; swap in a mass-per-kWh source if pack design varies. */
export const packMass = (kWh: number) => (kWh * PACK.mass.value) / PACK.capacity.value

/** Credit per tonne of battery: recovered mass × primary factor, with the substitution factor on battery materials only. */
function creditPerTonne(route: RouteId, substitution: number) {
  return Object.entries(RECOVERED[route]).reduce((t, [m, v]) => {
    const share = SUBSTITUTABLE.includes(m as Material) ? substitution : 1
    return t + (v!.value * PRIMARY_FACTOR[m as Material].value * share) / 1000
  }, 0)
}

/** Process burden per tonne: Blömeke's (credit − |net|) with its electricity moved from the German to the chosen grid. */
function processPerTonne(route: RouteId, region: RegionId) {
  const german = creditPerTonne(route, 1) + NET[route].value
  return german + (ELECTRICITY[route].value * (REGIONS[region].grid.value - BASE_GRID.value)) / 1e6
}

export function calculate({ packKwh, route, region, substitution }: Inputs): Result {
  const massKg = packMass(packKwh)
  const t = massKg / 1000
  const process = processPerTonne(route, region) * t
  const credit = creditPerTonne(route, substitution) * t
  return { massKg, recoveredKg: massKg * RECOVERY_TOTAL[route].value, process, credit, net: process - credit }
}
