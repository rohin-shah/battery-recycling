/**
 * Every number the model uses, with where it came from.
 * how: 'stated' = printed in the source (text, table or a value label on a figure);
 *      'chart-read' = read off a figure; 'derived' = calculated from stated values.
 */

export type SourceId = 'blomeke2022' | 'ember2026' | 'wesselkamper2025' | 'wbar2009' | 'dbt2025' | 'faraday2024' | 'assumption' | 'you'

export const SOURCES: Record<SourceId, { name: string; url?: string }> = {
  blomeke2022: {
    name: 'Blömeke et al. (2022), Material and energy flow analysis for environmental and economic impact assessment of industrial recycling routes for lithium-ion traction batteries, J. Cleaner Production 377, 134344',
    url: 'https://doi.org/10.1016/j.jclepro.2022.134344',
  },
  ember2026: {
    name: 'Ember (2026), Yearly Electricity Data, CC BY 4.0',
    url: 'https://ember-energy.org/data/yearly-electricity-data/',
  },
  wesselkamper2025: {
    name: 'Wesselkämper et al. (2025), Recycling or Second Use? Supply Potentials and Climate Effects of End-of-Life Electric Vehicle Batteries, Environ. Sci. Technol. 59, 15751',
    url: 'https://doi.org/10.1021/acs.est.5c01823',
  },
  wbar2009: {
    name: 'The Waste Batteries and Accumulators Regulations 2009 (SI 2009/890), regulation 56',
    url: 'https://www.legislation.gov.uk/uksi/2009/890/regulation/56',
  },
  dbt2025: {
    name: 'Frazer-Nash Consultancy for the Department for Business and Trade (2025), UK critical minerals recycling and midstream processing capability assessment (grey literature)',
    url: 'https://www.gov.uk/government/publications/uk-critical-minerals-midstream-and-recycling-capability-report',
  },
  faraday2024: {
    name: 'Leong, Faraday Institution (2024), Faraday Insights 20: Developing a UK lithium-ion battery recycling industry (grey literature)',
    url: 'https://www.faraday.ac.uk/wp-content/uploads/2024/07/Faraday_Insights_20_FINAL.pdf',
  },
  assumption: { name: 'Assumption (see How this was counted)' },
  you: { name: 'Your choice' },
}

export type Value = {
  value: number
  unit: string
  source: SourceId
  how: 'stated' | 'chart-read' | 'derived'
  /** Where in the source, e.g. "Table 3" */
  where?: string
  note?: string
}

const blo = (value: number, unit: string, where: string, how: Value['how'] = 'stated', note?: string): Value => ({
  value,
  unit,
  source: 'blomeke2022',
  how,
  where,
  note,
})

/** A figure the site calculates from sourced inputs, for its source card. */
export const derived = (value: number, unit: string, note: string): Value => ({ value, unit, source: 'blomeke2022', how: 'derived', note })

export type RouteId = 'pyro' | 'mechanical' | 'thermal'
export const ROUTES: Record<RouteId, string> = {
  pyro: 'Pyrometallurgical + hydrometallurgical',
  mechanical: 'Mechanical + hydrometallurgical',
  thermal: 'Thermal-mechanical + hydrometallurgical',
}

export type Material = 'aluminium' | 'steel' | 'copper' | 'nickelSulphate' | 'cobaltSulphate' | 'manganeseSulphate' | 'lithiumCarbonate' | 'graphite'

/** The modelled plant's capacity in the baseline scenario. */
export const PLANT = blo(25000, 't of spent batteries a year', 'Section 3.2, Table 3')

/** Blömeke's modelled pack: BatPaC NMC622 pouch cells. */
export const PACK = {
  mass: blo(576.38, 'kg', 'Table 2'),
  capacity: blo(95, 'kWh', 'Table 2'),
}

/** Carbon avoided per kg of primary material replaced (ecoinvent 3.8, IPCC 2013 GWP100). */
export const PRIMARY_FACTOR: Record<Material, Value> = {
  aluminium: blo(9.922, 'kg CO₂e/kg', 'Table SM.6.1'),
  steel: blo(1.741, 'kg CO₂e/kg', 'Table SM.6.1', 'stated', 'Pig iron'),
  copper: blo(5.865, 'kg CO₂e/kg', 'Table SM.6.1'),
  nickelSulphate: blo(4.743, 'kg CO₂e/kg', 'Table SM.6.1'),
  cobaltSulphate: blo(24.299, 'kg CO₂e/kg', 'Table SM.6.1', 'stated', 'Hydrated (CoSO₄·7H₂O); other studies use far lower cobalt factors'),
  manganeseSulphate: blo(0.81, 'kg CO₂e/kg', 'Table SM.6.1'),
  lithiumCarbonate: blo(7.635, 'kg CO₂e/kg', 'Table SM.6.1'),
  graphite: blo(6.131, 'kg CO₂e/kg', 'Table SM.6.1'),
}

/** Battery materials: the substitution factor applies only to these (Section 4.2). */
export const SUBSTITUTABLE: Material[] = ['nickelSulphate', 'cobaltSulphate', 'manganeseSulphate', 'lithiumCarbonate', 'graphite']

/** Recovered material, kg per tonne of spent battery (Table 3 baseline outputs ÷ 25,000 t). */
export const RECOVERED: Record<RouteId, Partial<Record<Material, Value>>> = {
  pyro: {
    aluminium: blo(250, 'kg/t', 'Table 3'),
    steel: blo(62.8, 'kg/t', 'Table 3'),
    copper: blo(78, 'kg/t', 'Table 3'),
    nickelSulphate: blo(359.2, 'kg/t', 'Table 3'),
    cobaltSulphate: blo(126.8, 'kg/t', 'Table 3'),
  },
  mechanical: {
    aluminium: blo(295.6, 'kg/t', 'Table 3'),
    steel: blo(91.2, 'kg/t', 'Table 3'),
    copper: blo(83.6, 'kg/t', 'Table 3'),
    graphite: blo(118, 'kg/t', 'Table 3'),
    nickelSulphate: blo(318, 'kg/t', 'Table 3'),
    cobaltSulphate: blo(112.4, 'kg/t', 'Table 3'),
    manganeseSulphate: blo(68.4, 'kg/t', 'Table 3'),
    lithiumCarbonate: blo(64.8, 'kg/t', 'Table 3'),
  },
  thermal: {
    aluminium: blo(296.4, 'kg/t', 'Table 3'),
    steel: blo(91.6, 'kg/t', 'Table 3'),
    copper: blo(83.2, 'kg/t', 'Table 3'),
    nickelSulphate: blo(334.4, 'kg/t', 'Table 3'),
    cobaltSulphate: blo(116.8, 'kg/t', 'Table 3'),
  },
}

/** Total share of the pack's mass recovered (bar labels). */
export const RECOVERY_TOTAL: Record<RouteId, Value> = {
  pyro: blo(0.5, 'fraction', 'Fig. 7'),
  mechanical: blo(0.72, 'fraction', 'Fig. 7'),
  thermal: blo(0.57, 'fraction', 'Fig. 7'),
}

/** EU legal minimum recovery rate, which Blömeke checks every route against. */
export const EU_MINIMUM = blo(0.5, 'fraction of mass', 'Section 4.1')

/** Process facts quoted in the chapters. */
export const PROCESS = {
  residualEnergy: blo(30, 'kWh', 'SM.3', 'stated', 'Assumed: about a third of the pack’s capacity when it arrives'),
  /** Housing, electronics, cables and connectors (Table 2 "pack" level) as a share of the pack's mass. */
  peripheryShare: blo(194.89 / 576.38, 'fraction', 'Table 2', 'derived', 'The text says “more than 30%”'),
  disassemblyHours: blo(2, 'hours, two workers', 'Section 3.2 (Routes 1 and 2; 3 h for Route 3)'),
  slagIron: blo(0.7, 'fraction of iron', 'Section 3.2'),
  flueDustLithium: blo(0.14, 'fraction of lithium (up to)', 'Section 3.2, citing Verscheure et al. 2014'),
  digestion: blo(140, '°C', 'SM.2'),
  leachPh: blo(1, 'pH', 'SM.2'),
  lithiumPrecipitation: blo(90, '°C', 'SM.2'),
}

/** Share of each material recovered (Fig. 7 bar labels); absent = not recovered by that route in the baseline. */
export const RECOVERY_RATE: Record<RouteId, Partial<Record<'graphite' | 'cobalt' | 'nickel' | 'lithium' | 'manganese' | 'aluminium' | 'copper' | 'steel', number>>> = {
  pyro: { cobalt: 0.93, nickel: 0.94, aluminium: 0.79, copper: 0.91, steel: 0.65 },
  mechanical: { graphite: 0.83, cobalt: 0.83, nickel: 0.83, lithium: 0.72, manganese: 0.83, aluminium: 0.94, copper: 0.97, steel: 0.94 },
  thermal: { cobalt: 0.86, nickel: 0.88, aluminium: 0.94, copper: 0.97, steel: 0.94 },
}

/** Net result with full substitution, German grid (bar labels). */
export const NET: Record<RouteId, Value> = {
  pyro: blo(-5.76, 't CO₂e/t', 'Fig. 8c'),
  mechanical: blo(-6.7, 't CO₂e/t', 'Fig. 8c'),
  thermal: blo(-6.94, 't CO₂e/t', 'Fig. 8c'),
}

/** Net electricity use (Table 3 baseline ÷ 25,000 t). Not split by stage, so all of it moves with the hydromet location. */
export const ELECTRICITY: Record<RouteId, Value> = {
  pyro: blo(1564, 'kWh/t', 'Table 3'),
  mechanical: blo(692, 'kWh/t', 'Table 3'),
  thermal: blo(656, 'kWh/t', 'Table 3'),
}

const ember = (value: number, year: number): Value => ({
  value,
  unit: 'g CO₂e/kWh',
  source: 'ember2026',
  how: 'stated',
  where: `Power sector CO₂ intensity, ${year}`,
  note: 'Life-cycle, per kWh generated',
})

export type RegionId = 'southKorea' | 'china' | 'eu' | 'uk' | 'us'
export const REGIONS: Record<RegionId, { name: string; grid: Value }> = {
  southKorea: { name: 'South Korea', grid: ember(417.14, 2025) },
  china: { name: 'China', grid: ember(526.19, 2025) },
  eu: { name: 'EU', grid: ember(209.21, 2025) },
  uk: { name: 'United Kingdom', grid: ember(217.41, 2025) },
  us: { name: 'United States', grid: ember(384.4, 2025) },
}
/** Most UK black mass is exported to Asia for hydromet (Faraday Insights 20); South Korea stands in as the default. */
export const DEFAULT_REGION: RegionId = 'southKorea'

/** Removed when swapping grids, on the same (Ember) basis as the destination. Blömeke used 0.366 kg/kWh (UBA). */
export const BASE_GRID: Value = ember(355.61, 2020)

export const DEFAULTS = {
  packKwh: { value: 60, unit: 'kWh', source: 'assumption', how: 'stated', note: 'Typical UK EV; mass scaled linearly from Blömeke’s pack' } satisfies Value,
  substitution: { value: 1, unit: 'fraction', source: 'blomeke2022', how: 'stated', where: 'Section 4.2' } satisfies Value,
}

/** Second life: the paper's own California model, cumulative 2025–2050. */
export const SECOND_LIFE = {
  leavesCar: { value: 80, unit: '% of original capacity', source: 'wesselkamper2025', how: 'stated', where: 'Methods', note: 'Cut-off taken from prior literature' } satisfies Value,
  leavesStorage: { value: 60, unit: '% of original capacity', source: 'wesselkamper2025', how: 'stated', where: 'Methods' } satisfies Value,
  nmcCarLife: { value: 10, unit: 'years (average)', source: 'wesselkamper2025', how: 'stated', where: 'Methods' } satisfies Value,
  secondUseFirst: { value: 55.8, unit: 'Mt CO₂e saved', source: 'wesselkamper2025', how: 'stated', where: 'Fig. 5' } satisfies Value,
  recyclingFirst: { value: 48.3, unit: 'Mt CO₂e saved', source: 'wesselkamper2025', how: 'stated', where: 'Fig. 5' } satisfies Value,
}
