/**
 * A short tick, made in the browser (no sound file), for each step a slider crosses. Browsers only allow sound after
 * the reader has interacted with the page, and the first tick is always in response to a drag, so that is met.
 */
let audio: AudioContext | null = null

function tick(pitch: number, at: number) {
  audio ??= new AudioContext()
  if (audio.state === 'suspended') void audio.resume()
  const t = audio.currentTime + at
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(pitch, t)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(0.18, t + 0.003)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045)
  osc.connect(gain).connect(audio.destination)
  osc.start(t)
  osc.stop(t + 0.05)
}

/** How many of `points` lie between two slider values. */
const crossed = (points: number[], from: number, to: number) => points.filter((p) => (p > from && p <= to) || (p > to && p <= from)).length

/**
 * Play a tick for every step crossed between `from` and `to`, at the pitch of its kind of step, spaced slightly so a
 * fast drag still sounds like separate clicks. Also a very short buzz on phones that allow it.
 */
export function clickSteps(kinds: { points: number[]; pitch: number }[], from: number, to: number) {
  let n = 0
  try {
    for (const k of kinds) for (let i = crossed(k.points, from, to); i > 0; i--) tick(k.pitch, n++ * 0.04)
  } catch {
    // No sound available: the beads still show each step.
  }
  if (n) navigator.vibrate?.(8)
}
