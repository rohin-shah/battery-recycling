import { useId, type ReactNode } from 'react'
import { SOURCES, type Value } from '../model/data'

const HOW: Record<Value['how'], string> = {
  stated: 'Stated in the source',
  'chart-read': 'Read off a chart in the source',
  derived: 'Calculated from figures in the source',
}

/**
 * A number in the text that opens its source card when tapped: value, where it came from, and how it was obtained.
 * Uses the native popover, so it needs no positioning code and closes on Escape or a tap outside.
 */
export function Num({ v, children }: { v: Value; children: ReactNode }) {
  const id = useId()
  const src = SOURCES[v.source]
  return (
    <>
      <button type="button" className="num" popoverTarget={id}>
        {children}
      </button>
      <span id={id} popover="auto" className="source-card" role="dialog" aria-label="Source">
        <strong>
          {children} <span className="unit">({v.unit})</span>
        </strong>
        <span>{HOW[v.how]}{v.where ? `: ${v.where}` : ''}.</span>
        {v.note && <span>{v.note}.</span>}
        <span>
          {src.url ? (
            <a href={src.url} target="_blank" rel="noreferrer">
              {src.name}
            </a>
          ) : (
            src.name
          )}
        </span>
        <button type="button" className="close" popoverTarget={id} popoverTargetAction="hide">
          Close
        </button>
      </span>
    </>
  )
}
