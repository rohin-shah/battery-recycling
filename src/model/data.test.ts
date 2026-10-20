import { expect, test } from 'vitest'
import { NET, PRIMARY_FACTOR, RECOVERED, type Material, type RouteId } from './data'

// Transcription check: recovered mass × primary factor must rebuild Blömeke's credits (Fig. 8c, chart-read ±0.05 t),
// and credit − |net| must give its process burden.
const FIG_8C: Record<RouteId, { credit: number; burden: number }> = {
  pyro: { credit: 7.86, burden: 2.1 },
  mechanical: { credit: 9.08, burden: 2.38 },
  thermal: { credit: 8.01, burden: 1.08 },
}

test.each(Object.keys(FIG_8C) as RouteId[])('%s credits and burden match Fig. 8c', (route) => {
  const credit = Object.entries(RECOVERED[route]).reduce((t, [m, v]) => t + (v!.value * PRIMARY_FACTOR[m as Material].value) / 1000, 0)
  expect(credit).toBeCloseTo(FIG_8C[route].credit, 1)
  expect(credit + NET[route].value).toBeCloseTo(FIG_8C[route].burden, 1)
})
