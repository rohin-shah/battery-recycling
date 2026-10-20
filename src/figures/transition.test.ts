import { expect, test } from 'vitest'
import { split } from './transition'

test('scrubber progress maps to the step being entered and how far into it', () => {
  expect(split(0)).toEqual({ step: 0, t: 1 })
  expect(split(0.25)).toEqual({ step: 1, t: 0.25 })
  expect(split(1)).toEqual({ step: 1, t: 1 })
  expect(split(2.5)).toEqual({ step: 3, t: 0.5 })
  // Float noise just past a whole step still counts as settled on it.
  expect(split(2 + 1e-9)).toEqual({ step: 2, t: expect.closeTo(1, 6) })
})
