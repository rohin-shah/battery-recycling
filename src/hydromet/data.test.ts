import { expect, test } from 'vitest'
import { leached, settled, settledMixed } from './data'

test('dissolving follows the measured points (Chen & Ho 2018)', () => {
  expect(leached('cobalt', 0)).toBe(0)
  expect(leached('cobalt', 0.25)).toBe(43.7)
  expect(leached('cobalt', 2)).toBe(91.6)
  expect(leached('lithium', 2)).toBe(94)
  expect(leached('nickel', 0.375)).toBeCloseTo(72.5, 5) // halfway between 65 and 80
  expect(leached('manganese', 5)).toBe(91.8) // held at the last point used
})

test('impurity removal follows the measured points (Chernyaev 2021)', () => {
  expect(settled('iron', 1)).toBe(0)
  expect(settled('iron', 4)).toBe(97.5)
  expect(settled('nickel', 5.5)).toBe(57)
  expect(settled('nickel', 4.25)).toBeCloseTo(18.5, 5)
  expect(settled('cobalt', 9)).toBe(25)
})

test('hydroxides settle in the order nickel, cobalt, manganese; lithium never does', () => {
  // Nothing has settled at the start of the range.
  for (const m of ['nickel', 'cobalt', 'manganese', 'lithium'] as const) expect(settledMixed(m, 5.5)).toBe(0)
  // Each metal starts to settle where [M][OH]² reaches Ksp: nickel about pH 6.8, cobalt 7.1, manganese 7.9.
  expect(settledMixed('nickel', 6.7)).toBe(0)
  expect(settledMixed('nickel', 6.9)).toBeGreaterThan(0)
  expect(settledMixed('cobalt', 7.0)).toBe(0)
  expect(settledMixed('cobalt', 7.2)).toBeGreaterThan(0)
  expect(settledMixed('manganese', 7.9)).toBe(0)
  expect(settledMixed('manganese', 8.1)).toBeGreaterThan(0)
  // One pH unit above the start, 99% is out (the dissolved amount falls a hundredfold per unit).
  expect(settledMixed('nickel', 7.76)).toBeCloseTo(99, 0)
  expect(settledMixed('manganese', 11)).toBeGreaterThan(99.99)
  expect(settledMixed('lithium', 11)).toBe(0)
})
