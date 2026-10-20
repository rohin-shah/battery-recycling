import { useState } from 'react'
import { Figure } from '../figures/Figure'
import { PRETREATMENT, PretreatmentFigure } from '../figures/PretreatmentFigure'
import { PROCESS, RECOVERY_TOTAL, ROUTES, type RouteId } from '../model/data'
import { Choice, Steps } from '../ui/controls'
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
        The modules go into a furnace with limestone and sand. At those temperatures the plastics and graphite burn away. Two things come out. An <Ink c="steel">alloy</Ink> collects the cobalt, nickel, copper and some of the iron. A <Ink c="slag">slag</Ink>{' '}
        takes the lithium, manganese, aluminium and about {pct(PROCESS.slagIron.value)} of the iron, and up to {pct(PROCESS.flueDustLithium.value)} of the
        lithium leaves with the flue dust. Unless the slag is treated too, those are lost: this route recovers {pct(RECOVERY_TOTAL.pyro.value)} of the pack by
        mass.
      </p>
      <h3>Mechanical: shred it cold</h3>
      <p>
        The modules are crushed in an inert nitrogen atmosphere, and the process stays far cooler than a furnace. Gentle heat drives off the electrolyte, which is condensed and sold on. Sieves and air
        separators then sort the pieces: the <Ink c="copper">copper</Ink> and <Ink c="aluminium">aluminium</Ink> foils stay on top, and a fine dark powder,{' '}
        <Ink c="blackMass">black mass</Ink>, falls through. That powder holds the electrode coatings: nickel, cobalt, manganese, lithium and graphite. Nothing
        is burned, so all of it can be recovered: {pct(RECOVERY_TOTAL.mechanical.value)} of the pack by mass.
      </p>
      <h3>Thermal-mechanical: bake, then shred</h3>
      <p>
        The cells are first heated in a low-oxygen kiln (pyrolysis) to drive off the volatile compounds that make shredding dangerous. Then they’re shredded
        and sieved into black mass and foils, as above. In the version modelled here the black mass is then smelted like the first route, so its lithium and
        manganese end up in slag again: {pct(RECOVERY_TOTAL.thermal.value)} recovered by mass.
      </p>
      <p>Pick a route and step through it. Whichever you choose, what comes out next goes into acid.</p>
    </Chapter>
  )
}
