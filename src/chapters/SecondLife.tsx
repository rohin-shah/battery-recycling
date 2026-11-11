import { useState } from 'react'
import { Figure } from '../figures/Figure'
import { SecondLifeFigure, type LifeStage } from '../figures/SecondLifeFigure'
import { SECOND_LIFE } from '../model/data'
import { Slider } from '../ui/controls'
import { Num } from '../ui/Num'
import { Chapter, Cite } from './Chapter'

const { leavesCar, leavesStorage, secondUseFirst, recyclingFirst } = SECOND_LIFE

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
      <p>
        The best thing, as some studies have shown, is for the batteries to be simply extracted from the car, and put into battery storage. Here, they’re not
        required to be particularly energy dense so they serve a unique purpose of being affordable energy storage for the grid or homes to use on the grid
        when required.
      </p>
      <p>
        We can use LCA to assert if it’s better for the climate to build a new storage battery or repurpose an old one. One study of California’s EV batteries
        up to 2050 found that reusing them first saved more greenhouse gas in every case it tested: <Num v={secondUseFirst}>{secondUseFirst.value}</Num>{' '}
        million tonnes of CO₂e, against <Num v={recyclingFirst}>{recyclingFirst.value}</Num> million tonnes for recycling them straight away (
        <Cite source="wesselkamper2025">Wesselkämper et al. 2025</Cite>).
      </p>
    </Chapter>
  )
}
