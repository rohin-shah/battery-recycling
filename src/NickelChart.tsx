import { SOURCES } from './sources'

/**
 * Climate change impact of battery-grade nickel sulfate hexahydrate, mined against recycled, from
 * Minviro's white paper (Lase et al. 2025), Figure 3. Only bar heights are shown, not the values. Best and worst cases for recycling vary the energy source, chemicals and recovery
 * rates (spent NMC 622 packs); for mining they span the range of operations on each route.
 */
/** Bar heights as a share of the tallest, rounded: the published values themselves are not on the page. */
const ROWS: { name: string; route: string; height: number; recycled?: boolean }[] = [
  { name: 'Sulfide, pyro', route: 'best', height: 6 },
  { name: 'Laterite, HPAL', route: 'best', height: 13 },
  { name: 'Recycled', route: 'best', height: 15, recycled: true },
  { name: 'Sulfide, pyro', route: 'worst', height: 19 },
  { name: 'Recycled', route: 'typical', height: 35, recycled: true },
  { name: 'Recycled', route: 'worst', height: 45, recycled: true },
  { name: 'Laterite, HPAL', route: 'worst', height: 57 },
  { name: 'Laterite, RKEF', route: 'worst', height: 100 },
]

/** Bars only, highest to the right; no values are shown, just how the routes compare. */
export function NickelChart() {
  return (
    <figure className="nickel">
      <div className="nickel-panel">
        <p className="nickel-title">Climate change impact of battery-grade nickel sulfate</p>
        <ul className="nickel-legend" aria-hidden>
          <li className="mined">Mined</li>
          <li className="recycled">Recycled</li>
        </ul>
        <ol className="nickel-bars">
          {ROWS.map((r) => (
            <li key={`${r.name} ${r.route}`} className={r.recycled ? 'recycled' : 'mined'}>
              <span className="col">
                <i style={{ height: `${r.height}%` }} />
              </span>
              <span className="name">
                {r.name} <em>{r.route}</em>
              </span>
            </li>
          ))}
        </ol>
        <p className="nickel-axis">Lower is better</p>
      </div>
      <figcaption>
        Climate change impact per kilogram of battery-grade nickel sulfate hexahydrate, from <a href={SOURCES.minviro2026.url}>Minviro’s white paper</a>{' '}
        (Lase, Myers, Shah &amp; Alacacayir, 2025), Figure 3. Recycling is of spent
        NMC 622 battery packs; its best and worst cases vary the energy source, chemicals and recovery rates. Laterite ore (as mined in Indonesia) is
        processed by HPAL or RKEF; sulfide ore (as mined in Canada) by pyrometallurgy.
      </figcaption>
    </figure>
  )
}
