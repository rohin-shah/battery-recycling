import type { ReactNode } from 'react'
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

/** An inline citation, e.g. (Wesselkämper et al. 2025). */
export const Cite = ({ source, children }: { source: SourceId; children: ReactNode }) => (
  <a className="cite" href={SOURCES[source].url} target="_blank" rel="noreferrer" title={SOURCES[source].name}>
    {children}
  </a>
)
