import { useState } from 'react'
import { Figure } from '../figures/Figure'
import { SecondLifeFigure, type LifeStage } from '../figures/SecondLifeFigure'
import { SECOND_LIFE } from '../model/data'
import { Slider } from '../ui/controls'
import { Num } from '../ui/Num'
import { Chapter, Cite } from './Chapter'

const { leavesCar, leavesStorage, nmcCarLife, secondUseFirst, recyclingFirst } = SECOND_LIFE

const stageAt = (capacity: number): LifeStage => (capacity >= leavesCar.value ? 'car' : capacity >= leavesStorage.value ? 'storage' : 'recycling')

const STAGES: [LifeStage, string][] = [
  ['car', 'In the car'],
  ['storage', 'Stationary storage'],
  ['recycling', 'Recycling'],
]

export function SecondLife() {
  const [capacity, setCapacity] = useState(100)
  const stage = stageAt(capacity)
  return (
    <Chapter
      title="Not every pack goes straight to recycling"
      figure={
        <Figure
          label={`Eight battery modules, now ${STAGES.find(([s]) => s === stage)![1].toLowerCase()}`}
          caption={
            <>
              <Slider label="Capacity left" value={capacity} min={50} max={100} step={1} format={(v) => `${v}%`} onChange={setCapacity} />
              <ol className="stages" aria-label="Where the modules are">
                {STAGES.map(([s, text]) => (
                  <li key={s} aria-current={s === stage ? 'step' : undefined}>
                    {text}
                  </li>
                ))}
              </ol>
            </>
          }
        >
          <SecondLifeFigure stage={stage} />
        </Figure>
      }
    >
      <p>A battery wears out slowly: with use, it holds a little less charge each year.</p>
      <p>
        Studies typically assume a pack is retired from the car once it’s down to about <Num v={leavesCar}>{leavesCar.value}%</Num> of its original capacity. For a
        nickel-based (NMC) pack that takes <Num v={nmcCarLife}>{nmcCarLife.value} years</Num> on average (<Cite source="wesselkamper2025">Wesselkämper et al. 2025</Cite>).
      </p>
      <p>
        <Num v={leavesCar}>{leavesCar.value}%</Num> is too little for a car, but plenty for a battery that never moves. Retired packs can be tested and their modules put to work as
        stationary storage, holding solar power for the evening or steadying the grid, until they fall to about <Num v={leavesStorage}>{leavesStorage.value}%</Num>. Drag the slider to
        age the pack.
      </p>
      <p>
        Does the detour help the climate? A second-life pack stands in for a new storage battery that would otherwise have been built. In a model of
        California’s EV batteries to 2050, sending packs to second use first saved more greenhouse gas than recycling them straight away in every
        scenario tested: <Num v={secondUseFirst}>{secondUseFirst.value}</Num> against <Num v={recyclingFirst}>{recyclingFirst.value}</Num> million tonnes CO₂e (
        <Cite source="wesselkamper2025">Wesselkämper et al. 2025</Cite>).
      </p>
      <p>This is the waste hierarchy at work: reuse before recycling. But storage batteries wear out too. What happens to them then?</p>
    </Chapter>
  )
}
