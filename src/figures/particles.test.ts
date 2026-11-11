import { expect, test } from 'vitest'
import { box, pile, positionAt, revealAt, type Stream } from './particles'

const a = pile([0, 0, 0], 0.5)
const b = pile([10, 0, 0], 0.5)
const s: Stream = { color: '#000', count: 1, legs: [a, a, { via: [box([5, 2, 0], [0.1, 0.1, 0.1])], to: b }] }

test('a piece is a pure function of time: settled at each step, moving between', () => {
  const at = (p: number) => positionAt(s, 0, p)
  expect(at(0)).toEqual(at(1)) // step 1 doesn't move this stream
  expect(at(2)[0]).toBeGreaterThan(9)
  expect(at(5)).toEqual(at(2)) // past the end it stays put
  expect(at(1.5)).toEqual(at(1.5)) // deterministic, so scrubbing back retraces exactly
})

test('colour is revealed during the first step that moves the stream', () => {
  expect(revealAt(s, 1)).toBe(0)
  expect(revealAt(s, 1.5)).toBe(0.5)
  expect(revealAt(s, 2)).toBe(1)
})
