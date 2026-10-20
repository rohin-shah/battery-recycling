import type { ReactNode } from 'react'

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
