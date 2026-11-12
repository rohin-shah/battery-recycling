import { expect, test } from 'vitest'
import { settled, settledMixed } from './data'

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
