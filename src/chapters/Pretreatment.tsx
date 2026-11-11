import { useState } from 'react'
import { Figure } from '../figures/Figure'
import { OUTPUTS, outputLabel, outputsSoFar, PRETREATMENT, PretreatmentFigure } from '../figures/PretreatmentFigure'
import { split } from '../figures/transition'
import { PROCESS, RECOVERY_TOTAL, ROUTES, type RouteId } from '../model/data'
import { Choice, Scrubber } from '../ui/controls'
import { Num } from '../ui/Num'
import { Chapter, Cite, Ink } from './Chapter'

const ROUTE_OPTIONS = Object.entries(ROUTES) as [RouteId, string][]
const pct = (v: number) => `${Math.round(v * 100)}%`

export function Pretreatment() {
  const [route, setRoute] = useState<RouteId>('pyro')
  const [progress, setProgress] = useState(0)
  const { step, t } = split(progress)
  // Outputs join the list once they've landed, about halfway through their step.
  const shown = outputsSoFar(route, t >= 0.6 ? step : step - 1)
  const steps = PRETREATMENT[route]
  return (
    <Chapter
      title="Three ways to get the metals out"
      figure={
        <Figure
          label={`${ROUTES[route]} route: ${steps[step].label.toLowerCase()}`}
          caption={
            <>
              <Choice
                label="Route"
                value={route}
                options={ROUTE_OPTIONS}
                onChange={(r) => {
                  setRoute(r)
                  setProgress(0)
                }}
              />
              <Scrubber label="Step" steps={steps.map((s) => s.label)} value={progress} onChange={setProgress} />
              <p className="legend" aria-live="polite">
                Out so far:{' '}
                {shown.length
                  ? shown.map((k) => (
                      <Ink key={k} c={OUTPUTS[k].ink}>
                        {outputLabel(route, k)}
                      </Ink>
                    ))
                  : 'nothing yet'}
              </p>
            </>
          }
        >
          <PretreatmentFigure route={route} progress={progress} />
        </Figure>
      }
    >
      <p>
        Recyclers use three main routes to get at the metals inside the cells. They all finish the same way, by dissolving the metals in acid (next chapter).
        Which route is used decides what can be saved (<Cite source="blomeke2022">Blömeke et al. 2022</Cite>). Pick a route, then drag the slider to run it,
        or tap a step to play it.
      </p>
      <h3>Melt it (pyrometallurgy)</h3>
      <p>
        The modules go into a furnace with limestone and sand. The plastic and graphite burn away, and the smoke passes through a filter that catches its{' '}
        <Ink c="dust">dust</Ink>. What’s left melts and separates into two layers, like oil on water. The heavy bottom layer is a{' '}
        <Ink c="steel">metal mix</Ink> of cobalt, nickel and copper. The light top layer is <Ink c="slag">slag</Ink> of lithium, manganese and aluminium. Up to{' '}
        <Num v={PROCESS.flueDustLithium}>{pct(PROCESS.flueDustLithium.value)}</Num> of the lithium escapes with the smoke and ends up in the filter dust. Unless
        the slag is processed too, its lithium, manganese and aluminium are lost. This route saves{' '}
        <Num v={RECOVERY_TOTAL.pyro}>{pct(RECOVERY_TOTAL.pyro.value)}</Num> of the battery by mass.
      </p>
      <h3>Shred it (mechanical)</h3>
      <p>
        The modules are shredded in nitrogen gas, so nothing can catch fire. A dryer drives off the <Ink c="electrolyte">electrolyte</Ink>, the battery’s
        liquid, which is collected and reused. A magnet pulls out the <Ink c="steel">steel</Ink>, and a sieve does the rest: the{' '}
        <Ink c="copper">copper</Ink> and <Ink c="aluminium">aluminium</Ink> foils stay on top, while a fine dark powder called{' '}
        <Ink c="blackMass">black mass</Ink> falls through. That powder holds the valuable nickel, cobalt, manganese, lithium and graphite. Nothing is burned,
        so all of them can be saved: <Num v={RECOVERY_TOTAL.mechanical}>{pct(RECOVERY_TOTAL.mechanical.value)}</Num> of the battery by mass.
      </p>
      <h3>Bake it, then shred it (thermal-mechanical)</h3>
      <p>
        Here the cells are first baked in an oven with little oxygen, which drives off the chemicals that make shredding risky. Then they’re shredded and
        sorted into black mass and foils, as above. But in the version studied here, the black mass then goes into a furnace like the first route, so its
        lithium and manganese end up in slag again: <Num v={RECOVERY_TOTAL.thermal}>{pct(RECOVERY_TOTAL.thermal.value)}</Num> saved by mass.
      </p>
    </Chapter>
  )
}
