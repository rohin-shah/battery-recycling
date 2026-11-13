import { type RefObject, useEffect, useState } from 'react'

/**
 * A gentle idle loop for a figure nobody has touched yet: while at least half of it is on screen, its slider rises a
 * little way and falls back, over and over, so the first few steps play out and the reader can see it's alive and
 * what the slider does. It stops for good the moment the reader moves the slider, and never runs for readers who
 * have asked for reduced motion. No sound plays: the knocks only come from the reader's own moves.
 *
 * Returns how far along the slider the loop is now (0 when idle is off).
 */
export function useIdle(box: RefObject<HTMLElement | null>, untouched: boolean, reach: number, period = 7): number {
  const [seen, setSeen] = useState(false)
  const [value, setValue] = useState(0)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.5 })
    io.observe(el)
    return () => io.disconnect()
  }, [box])
  const active = untouched && seen && typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  useEffect(() => {
    if (!active) return
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const turns = (now - start) / 1000 / period
      setValue((reach * (1 - Math.cos(2 * Math.PI * turns))) / 2)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, reach, period])
  return active ? value : 0
}
