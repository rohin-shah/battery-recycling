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
