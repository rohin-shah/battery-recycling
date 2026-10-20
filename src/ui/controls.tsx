import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'

export function Choice<T extends string>({ label, value, options, onChange }: {
  label: string
  value: T
  options: [T, string][]
  onChange: (v: T) => void
}) {
  return (
    <fieldset className="choice">
      <legend>{label}</legend>
      {options.map(([v, text]) => (
        <button key={v} type="button" aria-pressed={v === value} onClick={() => onChange(v)}>
          {text}
        </button>
      ))}
    </fieldset>
  )
}

/** A slider that scrubs through named steps, with the steps listed beneath and the current one highlighted. */
export function Steps({ label, steps, value, onChange }: { label: string; steps: string[]; value: number; onChange: (v: number) => void }) {
  return (
    <div className="steps">
      <Slider label={label} value={value} min={0} max={steps.length - 1} step={1} format={(v) => `${v + 1} of ${steps.length}`} onChange={onChange} />
      <ol className="stages" aria-label={label}>
        {steps.map((s, i) => (
          <li key={s} aria-current={i === value ? 'step' : undefined}>
            {s}
          </li>
        ))}
      </ol>
    </div>
  )
}

/** Seconds to play one step when a step is tapped or an arrow key pressed. */
const PLAY_SECONDS = 2

/**
 * A continuous scrubber through named steps: dragging plays the transitions at the reader's pace, forwards or back.
 * Tapping a step (or pressing an arrow key) plays smoothly to it.
 */
export function Scrubber({ label, steps, value, onChange }: { label: string; steps: string[]; value: number; onChange: (v: number) => void }) {
  const tween = useRef(0)
  const current = useRef(value)
  useLayoutEffect(() => {
    current.current = value
  })
  useEffect(() => () => cancelAnimationFrame(tween.current), [])
  const playTo = (target: number) => {
    cancelAnimationFrame(tween.current)
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (still) return onChange(target)
    let last = performance.now()
    const tick = (now: number) => {
      const v = current.current
      const move = ((now - last) / 1000 / PLAY_SECONDS) * Math.sign(target - v)
      last = now
      const next = Math.abs(target - v) <= Math.abs(move) ? target : v + move
      onChange(next)
      if (next !== target) tween.current = requestAnimationFrame(tick)
    }
    tween.current = requestAnimationFrame(tick)
  }
  const at = Math.round(value)
  return (
    <div className="steps">
      <label className="slider">
        <span>
          {label}: <strong>{steps[Math.ceil(value - 1e-6)] ?? steps[0]}</strong>
        </span>
        <input
          type="range"
          min={0}
          max={steps.length - 1}
          step="any"
          value={value}
          aria-valuetext={steps[at]}
          onChange={(e) => {
            cancelAnimationFrame(tween.current)
            onChange(Number(e.target.value))
          }}
          onKeyDown={(e) => {
            const by = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0
            if (!by) return
            e.preventDefault()
            playTo(Math.min(steps.length - 1, Math.max(0, (by > 0 ? Math.floor(value + 1e-6) : Math.ceil(value - 1e-6)) + by)))
          }}
        />
      </label>
      <ol className="stages" aria-label={label}>
        {steps.map((s, i) => (
          <li key={s} aria-current={i === at ? 'step' : undefined}>
            <button type="button" onClick={() => playTo(i)}>
              {s}
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function Slider({ label, value, min, max, step, format, hint, onChange }: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  hint?: ReactNode
  onChange: (v: number) => void
}) {
  return (
    <label className="slider">
      <span>
        {label}: <strong>{format(value)}</strong>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      {hint && <span className="hint">{hint}</span>}
    </label>
  )
}
