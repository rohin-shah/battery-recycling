import { SOURCES } from './sources'

/**
 * Climate change impact of battery-grade nickel sulfate hexahydrate, mined against recycled, from Minviro's white paper
 * (Lase et al. 2025), Figure 3. Best and worst cases for recycling vary the energy source, chemicals and recovery
 * rates (spent NMC 622 packs); for mining they span the range of operations on each route.
 */
const ROWS: { name: string; route: string; value: number; recycled?: boolean }[] = [
  { name: 'Nickel sulfide, pyrometallurgy', route: 'best case', value: 1.27 },
  { name: 'Nickel laterite, HPAL', route: 'best case', value: 2.83 },
  { name: 'NMC 622 recycling', route: 'best case', value: 3.31, recycled: true },
  { name: 'Nickel sulfide, pyrometallurgy', route: 'worst case', value: 4.21 },
  { name: 'NMC 622 recycling', route: 'typical', value: 7.81, recycled: true },
  { name: 'NMC 622 recycling', route: 'worst case', value: 10.21, recycled: true },
  { name: 'Nickel laterite, HPAL', route: 'worst case', value: 12.76 },
  { name: 'Nickel laterite, RKEF', route: 'worst case', value: 22.5 },
]
const MAX = 25

export function NickelChart() {
  return (
    <figure className="nickel">
      <div className="nickel-panel">
        <p className="nickel-title">Climate change impact of battery-grade nickel sulfate</p>
        <p className="nickel-unit">kg CO₂e per kg of nickel sulfate hexahydrate</p>
        <ul className="nickel-legend" aria-hidden>
          <li className="mined">Mined</li>
          <li className="recycled">Recycled</li>
        </ul>
        <ol className="nickel-bars">
          {ROWS.map((r) => (
            <li key={`${r.name} ${r.route}`} className={r.recycled ? 'recycled' : 'mined'}>
              <span className="name">
                {r.name} <em>{r.route}</em>
              </span>
              <span className="track">
                <i style={{ width: `${(r.value / MAX) * 100}%` }} />
                <b>{r.value.toFixed(2)}</b>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <figcaption>
        From <a href={SOURCES.minviro2026.url}>Minviro’s white paper</a> (Lase, Myers, Shah &amp; Alacacayir, 2025), Figure 3. Recycling is of spent
        NMC 622 battery packs; its best and worst cases vary the energy source, chemicals and recovery rates. Laterite ore (as mined in Indonesia) is
        processed by HPAL or RKEF; sulfide ore (as mined in Canada) by pyrometallurgy.
      </figcaption>
    </figure>
  )
}
