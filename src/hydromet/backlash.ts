/**
 * Backlash for the sliders, like the slack in a gear: the value the scene shows only moves once the thumb pushes it
 * past a small gap. Wiggling the thumb back and forth over a step then doesn't flip the step on and off, which made
 * beads fly to and fro. The ends of the slider are always reached exactly.
 */
export const GAP = 0.012 // as a share of the slider's travel

export function backlash(shown: number, thumb: number, [min, max]: [number, number], gap = GAP * (max - min)): number {
  if (thumb <= min || thumb >= max) return thumb
  return Math.min(thumb + gap, Math.max(thumb - gap, shown))
}

/** Where to draw the thumb: where the reader left it, unless the shown value has moved away from it some other way. */
export const thumbAt = (thumb: number | null, shown: number, [min, max]: [number, number]) =>
  thumb !== null && Math.abs(thumb - shown) <= GAP * (max - min) * 1.01 ? thumb : shown
