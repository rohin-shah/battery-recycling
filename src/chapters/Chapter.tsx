import type { ReactNode } from 'react'
import { ENCODING, type Ink as InkKey } from '../figures/encoding'
import { SOURCES, type SourceId } from '../model/data'

/** One step of the story: prose, with its figure beside it (wide) or pinned above it (phone). */
export function Chapter({ title, figure, children }: { title: string; figure: ReactNode; children: ReactNode }) {
  return (
    <section className="chapter">
      {figure}
      <div className="prose">
        <h2>{title}</h2>
        {children}
      </div>
    </section>
  )
}

/** A word in the prose keyed to its colour in the figures, e.g. <Ink c="nickel">nickel</Ink>. */
export const Ink = ({ c, children }: { c: InkKey; children: ReactNode }) => (
  <span className="ink">
    <i style={{ background: ENCODING[c] }} aria-hidden />
    {children}
  </span>
)

/** An inline citation, e.g. (Wesselkämper et al. 2025). */
export const Cite = ({ source, children }: { source: SourceId; children: ReactNode }) => (
  <a className="cite" href={SOURCES[source].url} target="_blank" rel="noreferrer" title={SOURCES[source].name}>
    {children}
  </a>
)
