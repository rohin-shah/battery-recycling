import { expect, test } from 'vitest'
import { settled } from './data'

test('settled % matches the measured points and interpolates between them', () => {
  expect(settled('iron', 1)).toBe(0)
  expect(settled('iron', 4)).toBe(97.5)
  expect(settled('nickel', 5.5)).toBe(57)
  expect(settled('nickel', 4.25)).toBeCloseTo(18.5, 5) // halfway between 9 and 28
  expect(settled('cobalt', 9)).toBe(25) // held at the last measured point
})
