import { Cite } from './chapters/Chapter'
import { BASE_GRID, ELECTRICITY, PACK, PLANT, SOURCES, type SourceId } from './model/data'
import { Num } from './ui/Num'

/** "How this was counted": the method, assumptions and sources, in the passive voice. */
export function Method() {
  return (
    <section className="method" aria-labelledby="method-h">
      <h2 id="method-h">How this was counted</h2>

      <h3>What is counted</h3>
      <p>
        Greenhouse gases in tonnes of CO₂ equivalent (100-year warming, IPCC 2013). Only climate change is counted. Recycling one pack is counted from the
        moment it reaches the recycler, through discharge, disassembly, pretreatment and hydrometallurgy, to the recovered materials. Collection and
        transport to the recycler are not counted.
      </p>

      <h3>The recycling routes</h3>
      <p>
        All process figures come from one study of three industrial routes at a <Num v={PLANT}>25,000 tonne</Num>-a-year plant in Germany (
        <Cite source="blomeke2022">Blömeke et al. 2022</Cite>). Its pack is a <Num v={PACK.capacity}>95 kWh</Num>, <Num v={PACK.mass}>576 kg</Num> NMC622
        pouch-cell pack. Using one study keeps the routes comparable: they share a background database (ecoinvent 3.8), a plant size and a pack.
      </p>

      <h3>Emitted and avoided</h3>
      <p>
        The “avoided burden” approach is used. Recycling is charged for its energy, reagents and waste treatment. It is credited for the mined material
        that the recovered material replaces, using the carbon of each primary material in the study. Both are shown separately, because the credit rests
        on an assumption: that recovered material really does replace mined material. The substitution slider under Advanced tests that assumption; below
        100% it reduces the credit for nickel, cobalt, manganese, lithium and graphite, as the study’s own sensitivity analysis does.
      </p>

      <h3>Your pack</h3>
      <p>
        Results per tonne of battery are scaled to the chosen pack size by mass, assuming the same mass per kWh as the study’s pack. Real packs vary, so
        this is a simplification.
      </p>

      <h3>Where the metals are refined</h3>
      <p>
        The study’s electricity use for each route (<Num v={ELECTRICITY.pyro}>{ELECTRICITY.pyro.value.toLocaleString('en-GB')}</Num>,{' '}
        <Num v={ELECTRICITY.mechanical}>{ELECTRICITY.mechanical.value}</Num> and <Num v={ELECTRICITY.thermal}>{ELECTRICITY.thermal.value}</Num> kWh per
        tonne) is moved from Germany’s grid to the chosen country’s. Both grids are taken from one dataset, on the same life-cycle basis (
        <Cite source="ember2026">Ember</Cite>): Germany at <Num v={BASE_GRID}>{Math.round(BASE_GRID.value)} g</Num> CO₂e per kWh in 2020, the study’s
        year, and the chosen country in 2025. Only electricity is moved; reagents are assumed to be made the same way everywhere.
      </p>

      <h3>Shortcuts taken</h3>
      <ul>
        <li>The study gives each route’s electricity as one total, not split by stage, so all of it is moved to the refining country, including the share
          used for pretreatment, which in practice happens in the UK.</li>
        <li>Packs are scaled by mass from a single pack design.</li>
        <li>Process emissions are calculated as the credit minus the study’s stated net result, so they inherit the study’s rounding.</li>
      </ul>

      <h3>Disagreements between studies</h3>
      <p>
        Studies disagree on the carbon of primary materials. The study itself notes that cobalt counts for more in its results than in an earlier study,
        likely because the cobalt dataset in ecoinvent 3.8 has higher emissions (<Cite source="blomeke2022">Blömeke et al. 2022</Cite>, Section 4.5). The
        study’s factors are kept throughout so the figures stay consistent with each other.
      </p>

      <h3>Left out</h3>
      <ul>
        <li>Lithium iron phosphate (LFP) batteries: the sources used here can’t model them at pack level without stacking assumptions.</li>
        <li>Second life in the calculator: the second-life chapter quotes one modelled result, from California, and it isn’t combined with the figures above.</li>
        <li>Collection and transport, money, and every impact other than climate change.</li>
        <li>Direct recycling, which the study doesn’t model.</li>
      </ul>

      <h3>How to read the numbers</h3>
      <p>
        Every number on this page can be tapped to show its source, where in the source it appears, and whether it is stated there, read off a chart, or
        calculated from stated figures.
      </p>

      <h3>Sources</h3>
      <ul className="sources">
        {(Object.keys(SOURCES) as SourceId[])
          .filter((id) => SOURCES[id].url)
          .map((id) => (
            <li key={id}>
              <a href={SOURCES[id].url} target="_blank" rel="noreferrer">
                {SOURCES[id].name}
              </a>
            </li>
          ))}
      </ul>
    </section>
  )
}
