import { DEFAULT_REGION, DEFAULTS, REGIONS, ROUTES, type RegionId, type RouteId } from './model/data'

/** Everything the reader chose. It all lives in the link, so a shared link opens the same build. */
export type Build = {
  /** Share of the pack's mass the reader guessed comes back, in %; null until they lock it in. */
  guess: number | null
  packKwh: number
  route: RouteId
  region: RegionId
  substitution: number
}

/** Slider ranges [min, max, step]; links are clamped and snapped to these too. */
export const LIMITS = {
  guess: [0, 100, 1],
  packKwh: [30, 110, 1],
  substitution: [0, 1, 0.05],
} as const

export const DEFAULT_BUILD: Build = {
  guess: null,
  packKwh: DEFAULTS.packKwh.value,
  route: 'mechanical',
  region: DEFAULT_REGION,
  substitution: DEFAULTS.substitution.value,
}

const OPTIONS = { route: Object.keys(ROUTES), region: Object.keys(REGIONS) }

export function toQuery(build: Build): string {
  return new URLSearchParams(Object.entries(build).filter(([, v]) => v !== null).map(([k, v]) => [k, String(v)])).toString()
}

/** Reads a build from a link. Anything missing, unknown or out of range falls back to a safe value. */
export function fromQuery(query: string): Build {
  const params = new URLSearchParams(query)
  const build = { ...DEFAULT_BUILD }
  for (const key of Object.keys(OPTIONS) as (keyof typeof OPTIONS)[]) {
    const v = params.get(key)
    if (OPTIONS[key].includes(v ?? '')) Object.assign(build, { [key]: v })
  }
  for (const key of Object.keys(LIMITS) as (keyof typeof LIMITS)[]) {
    const raw = params.get(key)
    const v = Number(raw)
    const [min, max, step] = LIMITS[key]
    // Snap to the step; the second round clears float noise such as 0.35000000000000003.
    if (raw && Number.isFinite(v)) build[key] = Number((Math.round(Math.min(max, Math.max(min, v)) / step) * step).toFixed(2))
  }
  return build
}
