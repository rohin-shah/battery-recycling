import { describe, expect, test } from 'vitest'
import { NET, PACK, type RouteId } from './data'
import { calculate, packMass } from './engine'

const ROUTES: RouteId[] = ['pyro', 'mechanical', 'thermal']
// Blömeke's own pack. Germany isn't a region choice, so the EU grid stands in and the checks allow for the swap.
const blomeke = (route: RouteId, substitution = 1) => calculate({ packKwh: PACK.capacity.value, route, region: 'eu', substitution })

describe('reproduces Blömeke 2022', () => {
  test.each(ROUTES)('%s net per tonne at full substitution is within grid swap of Fig. 8c', (route) => {
    const r = blomeke(route)
    const perTonne = r.net / (r.massKg / 1000)
    // EU grid is cleaner than Germany 2020, so net is slightly better than stated, never by more than Blömeke's own 10% grid sensitivity.
    expect(perTonne).toBeLessThanOrEqual(NET[route].value)
    expect(perTonne).toBeGreaterThan(NET[route].value * 1.1)
  })

  test('substitution 0.75 and 0.5 worsen the mechanical route by 20% and 41% (Section 4.4)', () => {
    const full = blomeke('mechanical').net
    expect(blomeke('mechanical', 0.75).net / full).toBeCloseTo(0.8, 1)
    expect(blomeke('mechanical', 0.5).net / full).toBeCloseTo(0.59, 1)
  })
})

test('a 60 kWh pack weighs about 364 kg and scales linearly', () => {
  expect(packMass(60)).toBeCloseTo(364, 0)
  const a = calculate({ packKwh: 60, route: 'mechanical', region: 'southKorea', substitution: 1 })
  const b = calculate({ packKwh: 120, route: 'mechanical', region: 'southKorea', substitution: 1 })
  expect(b.net).toBeCloseTo(2 * a.net, 6)
})

test('net = process − credit, and a cleaner grid only lowers process', () => {
  const korea = calculate({ packKwh: 60, route: 'pyro', region: 'southKorea', substitution: 1 })
  const uk = calculate({ packKwh: 60, route: 'pyro', region: 'uk', substitution: 1 })
  expect(korea.net).toBeCloseTo(korea.process - korea.credit, 9)
  expect(uk.process).toBeLessThan(korea.process)
  expect(uk.credit).toBe(korea.credit)
})

test('recovered mass follows Fig. 7 totals', () => {
  const r = calculate({ packKwh: 60, route: 'mechanical', region: 'southKorea', substitution: 1 })
  expect(r.recoveredKg / r.massKg).toBe(0.72)
})
