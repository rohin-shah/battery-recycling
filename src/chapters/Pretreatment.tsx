import { useState } from 'react'
import { Figure } from '../figures/Figure'
import { OUTPUTS, outputLabel, outputsSoFar, PRETREATMENT, PretreatmentFigure } from '../figures/PretreatmentFigure'
import { PROCESS, RECOVERY_TOTAL, ROUTES, type RouteId } from '../model/data'
import { Choice, Steps } from '../ui/controls'
import { Num } from '../ui/Num'
import { Chapter, Cite, Ink } from './Chapter'

const ROUTE_OPTIONS: [RouteId, string][] = [
  ['pyro', 'Pyrometallurgical'],
  ['mechanical', 'Mechanical'],
  ['thermal', 'Thermal-mechanical'],
]
const pct = (v: number) => `${Math.round(v * 100)}%`

export function Pretreatment() {
  const [route, setRoute] = useState<RouteId>('pyro')
  const [step, setStep] = useState(0)
  const steps = PRETREATMENT[route]
  return (
    <Chapter
      title="Three ways into the cells"
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
                  setStep(0)
                }}
              />
              <Steps label="Step" steps={steps.map((s) => s.label)} value={step} onChange={setStep} />
              <p className="legend" aria-live="polite">
                Out so far:{' '}
                {outputsSoFar(route, step).length
                  ? outputsSoFar(route, step).map((k) => (
                      <Ink key={k} c={OUTPUTS[k].ink}>
                        {outputLabel(route, k)}
                      </Ink>
                    ))
                  : 'nothing yet'}
              </p>
            </>
          }
        >
          <PretreatmentFigure route={route} step={step} />
        </Figure>
      }
    >
      <p>
        Every route ends the same way, dissolving metals in acid (next chapter). They differ in how they get the cells’ coatings into a form the acid can
        work on, and that choice decides what can be recovered at all (<Cite source="blomeke2022">Blömeke et al. 2022</Cite>).
      </p>
      <h3>Pyrometallurgical: melt it</h3>
      <p>
        The modules go into a furnace with limestone and sand as slag formers. They are pre-heated, decomposed and then smelted; along the way the plastics and
        graphite burn away, the electrolyte is driven off, and the off-gas passes through a bag filter that catches the <Ink c="dust">flue dust</Ink>. Two things come out. An <Ink c="steel">alloy</Ink> collects the cobalt, nickel, copper and some of the iron. A <Ink c="slag">slag</Ink>{' '}
        takes the lithium, manganese, aluminium and about <Num v={PROCESS.slagIron}>{pct(PROCESS.slagIron.value)}</Num> of the iron, and up to <Num v={PROCESS.flueDustLithium}>{pct(PROCESS.flueDustLithium.value)}</Num> of the
        lithium leaves with the flue dust. Unless the slag is treated too, those are lost: this route recovers <Num v={RECOVERY_TOTAL.pyro}>{pct(RECOVERY_TOTAL.pyro.value)}</Num> of the pack by
        mass.
      </p>
      <h3>Mechanical: shred it cold</h3>
      <p>
        The modules are crushed in an inert nitrogen atmosphere, and the process stays far cooler than a furnace. A dryer drives off the <Ink c="electrolyte">electrolyte</Ink>, which is condensed and sold on. A magnet lifts
        out the <Ink c="steel">steel</Ink>, and an air sifter blows away light aluminium, plastic and electronics. A second shredder breaks up what’s left,
        and a sieve separates it: a fine dark powder, <Ink c="blackMass">black mass</Ink>, falls through, while the <Ink c="copper">copper</Ink> and{' '}
        <Ink c="aluminium">aluminium</Ink> foils and the separator stay on top, to be split apart by a second sifter. That powder holds the electrode coatings: nickel, cobalt, manganese, lithium and graphite. Nothing
        is burned, so all of it can be recovered: <Num v={RECOVERY_TOTAL.mechanical}>{pct(RECOVERY_TOTAL.mechanical.value)}</Num> of the pack by mass.
      </p>
      <h3>Thermal-mechanical: bake, then shred</h3>
      <p>
        Here the modules are opened right down to individual cells. The cells are heated in a low-oxygen kiln (pyrolysis) to drive off the volatile compounds
        that make shredding dangerous. Then they’re shredded, a magnet pulls out the steel, and sieving and sifting split black mass from the foils. In the version modelled here the black mass is then smelted like the first route, so its lithium and
        manganese end up in slag again: <Num v={RECOVERY_TOTAL.thermal}>{pct(RECOVERY_TOTAL.thermal.value)}</Num> recovered by mass.
      </p>
      <p>Pick a route and step through it. Whichever you choose, what comes out next goes into acid.</p>
    </Chapter>
  )
}
