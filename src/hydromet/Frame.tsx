import { type CSSProperties, type PointerEvent, type ReactNode, useRef, useState } from 'react'

/** One line on a chart: a colour and a function from the slider value to a percentage. */
export type Series = { name: string; color: string; y: (x: number) => number }

const W = 320
const H = 196
const LEFT = 42 // room for the y-axis title and percentages
const ZOOM = 0.55 // how much of the x-range is cut away at the top of the slider

/**
 * Percentage against the slider's quantity, with a marker at the reader's value. As the slider moves up (`zoom` from
 * 0 to 1) the chart closes in on the reader's value, in step with the 3D view, showing a narrower stretch of the x-axis.
 */
export function Chart({
  series, range, left, right, value, label, yTitle, zoom = 0, band,
}: {
  series: Series[]; range: [number, number]; left: string; right: string; value: number; label: string; yTitle: string; zoom?: number
  /** A stretch of the x-axis to shade; its name is used for the screen-reader label only. */
  band?: { from: number; to: number; text: string }
}) {
  const span = (range[1] - range[0]) * (1 - ZOOM * zoom)
  const lo = Math.min(Math.max(value - span / 2, range[0]), range[1] - span)
  const hi = lo + span
  const x = (v: number) => LEFT + ((v - lo) / span) * (W - LEFT - 4)
  const y = (pct: number) => 8 + ((100 - pct) / 100) * (H - 44)
  const xs = Array.from({ length: 121 }, (_, i) => lo + (i / 120) * span)
  const step = span > 3 ? 1 : 0.5
  const ticks = Array.from({ length: Math.floor(hi / step) - Math.ceil(lo / step) + 1 }, (_, i) => (Math.ceil(lo / step) + i) * step)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="hm-chart" role="img" aria-label={label}>
      <text x={8} y={y(50)} textAnchor="middle" transform={`rotate(-90 8 ${y(50)})`} className="title">
        {yTitle}
      </text>
      {band && band.to > lo && band.from < hi && (
        <g className="band" aria-label={band.text}>
          <rect x={x(Math.max(band.from, lo))} y={4} width={x(Math.min(band.to, hi)) - x(Math.max(band.from, lo))} height={H - 36} />
        </g>
      )}
      {[0, 50, 100].map((p) => (
        <g key={p}>
          <line x1={LEFT} x2={W} y1={y(p)} y2={y(p)} className="grid" />
          <text x={LEFT - 5} y={y(p) + 3} textAnchor="end">{p}%</text>
        </g>
      ))}
      {ticks.map((p) => (
        <text key={p} x={x(p)} y={H - 18} textAnchor={x(p) > W - 12 ? 'end' : 'middle'}>{p}</text>
      ))}
      <text x={LEFT} y={H - 3}>{left}</text>
      <text x={W} y={H - 3} textAnchor="end">{right}</text>
      {series.map((s) => (
        <polyline key={s.name} fill="none" stroke={s.color} strokeWidth={1.6} strokeLinejoin="round" points={xs.map((p) => `${x(p)},${y(s.y(p))}`).join(' ')} />
      ))}
      <line x1={x(value)} x2={x(value)} y1={4} y2={H - 32} className="cursor" />
      {series.map((s) => (
        <circle key={s.name} cx={x(value)} cy={y(s.y(value))} r={3.5} fill={s.color} stroke="#18202a" />
      ))}
    </svg>
  )
}

/**
 * The slider's settings. `track` is the full scale drawn, when it is wider than the range this figure lets the reader use
 * (`min` to `max`): the rest of the rail is greyed out, so one quantity can carry on from figure to figure.
 */
export type Slider = {
  left: string; right: string; text: string; min: number; max: number; step: number; value: number; set: (v: number) => void; label: string
  track?: [number, number]
  /** The whole slider's colour now, and a line saying what that colour means. */
  tone?: string; note?: string
}

/**
 * The slider, standing upright on the right of the 3D view: the top end is `right` (more of what the reader adds),
 * the bottom end `left`. Steps, if any, are marked beside the track.
 */
function VerticalSlider({ slider }: { slider: Slider }) {
  const { min, max } = slider
  const [from, to] = slider.track ?? [min, max]
  const at = (v: number) => `${((v - from) / (to - from)) * 100}%`
  // On a touch screen a vertical drag would scroll the page, so the track takes the drag itself: the whole column is
  // the hit area, the browser is told not to pan there (touch-action: none in the CSS), and the value follows the
  // finger. The range input underneath stays for the keyboard and screen readers.
  const dragging = useRef<number | null>(null)
  const follow = (e: PointerEvent<HTMLSpanElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const share = Math.min(1, Math.max(0, (r.bottom - 8 - e.clientY) / (r.height - 16)))
    const v = Math.round((from + share * (to - from)) / slider.step) * slider.step
    slider.set(Math.min(max, Math.max(min, v)))
  }
  return (
    <label className="hm-vslider">
      <span>{slider.right}</span>
      <span
        className="hm-vtrack" style={{ ...(slider.tone && { '--tone': slider.tone }), '--from': at(min), '--to': at(max) } as CSSProperties}
        onPointerDown={(e) => {
          e.preventDefault()
          dragging.current = e.pointerId
          try {
            e.currentTarget.setPointerCapture(e.pointerId) // keep the drag even if the finger leaves the column
          } catch {
            // Capture isn't always available; the drag still works while over the column.
          }
          e.currentTarget.querySelector('input')?.focus()
          follow(e)
        }}
        onPointerMove={(e) => dragging.current === e.pointerId && follow(e)}
        onPointerUp={() => (dragging.current = null)}
        onPointerCancel={() => (dragging.current = null)}
      >
        <i className="rail" aria-hidden />
        <input
          type="range" min={from} max={to} step={slider.step} value={slider.value} aria-label={slider.label}
          aria-valuetext={slider.note ? `${slider.text}: ${slider.note}` : slider.text}
          onChange={(e) => slider.set(Math.min(max, Math.max(min, Number(e.target.value))))}
        />
      </span>
      <span>{slider.left}</span>
      <b>{slider.text}</b>
    </label>
  )
}

export type KeyItem = { name: string; color: string; note?: string }
export type Readout = { name: string; value: string }

/** The dark panel around a figure: 3D view with its slider on the right, then optionally a chart, key, readouts and equations. */
export function Frame({
  view, chart, keyTitle, keys, readouts, equations, slider, caption,
}: {
  view: ReactNode; chart?: ReactNode; keyTitle?: string; keys?: KeyItem[]; readouts?: Readout[]; equations?: string[]
  slider: Slider
  caption: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const side = chart || keys || readouts || equations
  return (
    <figure className="hm">
      <div className="hm-panel">
        <div className={side ? 'hm-stage' : 'hm-stage hm-solo'}>
          <div className="hm-main">
            {view}
            {/* What the slider's current colour means, as one line across the top of the scene */}
            {slider.note && (
              <p className="hm-status" style={{ '--tone': slider.tone } as CSSProperties} aria-live="polite">
                {slider.note}
              </p>
            )}
            <VerticalSlider slider={slider} />
          </div>
          {side && (
            <div className="hm-side">
              {chart}
              {keyTitle && <p className="hm-key-title">{keyTitle}</p>}
              {keys && (
                <ul className="hm-key">
                  {keys.map((k) => (
                    <li key={k.name}>
                      <i style={{ background: k.color }} />
                      {k.name}
                      {k.note && <b> {k.note}</b>}
                    </li>
                  ))}
                </ul>
              )}
              {readouts && (
                <dl className="hm-readout">
                  {readouts.map((r) => (
                    <div key={r.name}>
                      <dt>{r.name}</dt>
                      <dd>{r.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {equations && (
                <>
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
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  )
}
