/**
 * A short wooden knock, made in the browser (no sound file), for each step a slider crosses. Browsers only allow sound
 * after the reader has interacted with the page, and the first knock is always in response to a drag, so that is met.
 */
let audio: AudioContext | null = null

function envelope(gain: GainNode, t: number, peak: number, length: number) {
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(peak, t + 0.004)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length)
}

/** A knock at `pitch` Hz: a burst of noise through a narrow filter for the click, over a low sine thump for body. */
function knock(pitch: number, at: number) {
  audio ??= new AudioContext()
  if (audio.state === 'suspended') void audio.resume()
  const a = audio
  const t = a.currentTime + at

  const noise = a.createBufferSource()
  const buffer = a.createBuffer(1, Math.ceil(a.sampleRate * 0.04), a.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  noise.buffer = buffer
  const band = a.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = pitch
  band.Q.value = 12
  const click = a.createGain()
  envelope(click, t, 0.9, 0.035)
  noise.connect(band).connect(click).connect(a.destination)
  noise.start(t)

  // The bass: a sine a few octaves below the click, falling in pitch as it fades, like a knock on a hollow box.
  const thump = a.createOscillator()
  thump.type = 'sine'
  thump.frequency.setValueAtTime(pitch / 6, t)
  thump.frequency.exponentialRampToValueAtTime(pitch / 10, t + 0.09)
  const body = a.createGain()
  envelope(body, t, 0.5, 0.1)
  thump.connect(body).connect(a.destination)
  thump.start(t)
  thump.stop(t + 0.11)
}

/** How many of `points` lie between two slider values. */
const crossed = (points: number[], from: number, to: number) => points.filter((p) => (p > from && p <= to) || (p > to && p <= from)).length

/**
 * Knock once for every step crossed between `from` and `to`, at the pitch of its kind of step, spaced slightly so a
 * fast drag still sounds like separate steps. Also a very short buzz on phones that allow it.
 */
export function clickSteps(kinds: { points: number[]; pitch: number }[], from: number, to: number) {
  let n = 0
  try {
    for (const k of kinds) for (let i = crossed(k.points, from, to); i > 0; i--) knock(k.pitch, n++ * 0.06)
  } catch {
    // No sound available: the beads still show each step.
  }
  if (n) navigator.vibrate?.(8)
}
