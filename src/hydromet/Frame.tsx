import { type ReactNode, useState } from 'react'

/** One line on a chart: a colour and a function from the slider value to a percentage. */
export type Series = { name: string; color: string; y: (x: number) => number }

const W = 320
const H = 190

/** Percentage against the slider's quantity, with a marker at the reader's value. */
export function Chart({
  series, range, ticks, left, right, value, label, shade,
}: {
  series: Series[]; range: [number, number]; ticks: number[]; left: string; right: string; value: number; label: string
  /** An x-range to mark as not measured. */
  shade?: [number, number]
}) {
  const x = (v: number) => 34 + ((v - range[0]) / (range[1] - range[0])) * (W - 44)
  const y = (pct: number) => 12 + ((100 - pct) / 100) * (H - 40)
  const xs = Array.from({ length: 121 }, (_, i) => range[0] + (i / 120) * (range[1] - range[0]))
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="hm-chart" role="img" aria-label={label}>
      {shade && <rect x={x(shade[0])} y={10} width={x(shade[1]) - x(shade[0])} height={H - 36} className="shade" />}
      {[0, 50, 100].map((p) => (
        <g key={p}>
          <line x1={34} x2={W - 10} y1={y(p)} y2={y(p)} className="grid" />
          <text x={28} y={y(p) + 3} textAnchor="end">{p}%</text>
        </g>
      ))}
      {ticks.map((p) => (
        <text key={p} x={x(p)} y={H - 12} textAnchor="middle">{p}</text>
      ))}
      <text x={34} y={H - 1}>{left}</text>
      <text x={W - 10} y={H - 1} textAnchor="end">{right}</text>
      {series.map((s) => (
        <polyline key={s.name} fill="none" stroke={s.color} strokeWidth={1.6} strokeLinejoin="round" points={xs.map((p) => `${x(p)},${y(s.y(p))}`).join(' ')} />
      ))}
      <line x1={x(value)} x2={x(value)} y1={8} y2={H - 26} className="cursor" />
      {series.map((s) => (
        <circle key={s.name} cx={x(value)} cy={y(s.y(value))} r={3.5} fill={s.color} stroke="#0f1512" />
      ))}
    </svg>
  )
}

export type KeyItem = { name: string; color: string; note?: string }
export type Readout = { name: string; value: string }

/** The dark panel around a figure: 3D view, chart, key, readouts, equations and one slider. */
export function Frame({
  view, chart, keyTitle, keys, readouts, equations, slider, caption,
}: {
  view: ReactNode; chart: ReactNode; keyTitle: string; keys: KeyItem[]; readouts: Readout[]; equations: string[]
  slider: { left: string; right: string; text: string; min: number; max: number; step: number; value: number; set: (v: number) => void; label: string }
  caption: ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <figure className="hm">
      <div className="hm-panel">
        <div className="hm-stage">
          {view}
          <label className="hm-slider">
            <span>
              {slider.left} <b>{slider.text}</b> {slider.right}
            </span>
            <input
              type="range" min={slider.min} max={slider.max} step={slider.step} value={slider.value} aria-label={slider.label}
              onChange={(e) => slider.set(Number(e.target.value))}
            />
          </label>
          <div className="hm-side">
            {chart}
            <p className="hm-key-title">{keyTitle}</p>
            <ul className="hm-key">
              {keys.map((k) => (
                <li key={k.name}>
                  <i style={{ background: k.color }} />
                  {k.name}
                  {k.note && <b> {k.note}</b>}
                </li>
              ))}
            </ul>
            <dl className="hm-readout">
              {readouts.map((r) => (
                <div key={r.name}>
                  <dt>{r.name}</dt>
                  <dd>{r.value}</dd>
                </div>
              ))}
            </dl>
            <label className="hm-toggle">
              <input type="checkbox" checked={open} onChange={(e) => setOpen(e.target.checked)} /> Show the equations
            </label>
            {open && (
              <ul className="hm-eq">
                {equations.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  )
}
