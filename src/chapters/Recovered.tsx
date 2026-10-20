import { useState } from 'react'
import { Figure } from '../figures/Figure'
import { MATERIAL_INK, ORDER, RecoveredFigure } from '../figures/RecoveredFigure'
import { DEFAULTS, RECOVERED, RECOVERY_RATE, RECOVERY_TOTAL, ROUTES, type Material, type RouteId } from '../model/data'
import { packMass } from '../model/engine'
import { Choice } from '../ui/controls'
import { Chapter, Cite, Ink } from './Chapter'

const NAMES: Record<Material, string> = {
  nickelSulphate: 'Nickel sulphate',
  cobaltSulphate: 'Cobalt sulphate',
  manganeseSulphate: 'Manganese sulphate',
  lithiumCarbonate: 'Lithium carbonate',
  graphite: 'Graphite',
  aluminium: 'Aluminium',
  copper: 'Copper',
  steel: 'Steel',
}
const ROUTE_OPTIONS: [RouteId, string][] = [
  ['pyro', 'Pyrometallurgical'],
  ['mechanical', 'Mechanical'],
  ['thermal', 'Thermal-mechanical'],
]
const massT = packMass(DEFAULTS.packKwh.value) / 1000

export function Recovered() {
  const [route, setRoute] = useState<RouteId>('mechanical')
  const kg = Object.fromEntries(ORDER.map((m) => [m, (RECOVERED[route][m]?.value ?? 0) * massT])) as Record<Material, number>
  const rates = RECOVERY_RATE[route]
  return (
    <Chapter
      title="What comes back"
      figure={
        <Figure
          label={`Materials recovered from a ${DEFAULTS.packKwh.value} kWh pack by the ${ROUTES[route].toLowerCase()} route`}
          caption={<Choice label="Route" value={route} options={ROUTE_OPTIONS} onChange={setRoute} />}
        >
          <RecoveredFigure kg={kg} />
        </Figure>
      }
    >
      <p>
        Here is what comes out of a {DEFAULTS.packKwh.value} kWh pack (about {Math.round(massT * 1000)} kg), by route (
        <Cite source="blomeke2022">Blömeke et al. 2022</Cite>). The metals leave as salts, so their masses include the sulphate or carbonate and some water
        bound into the crystals: a kilogram of <Ink c="nickel">nickel sulphate</Ink> holds well under a kilogram of nickel.
      </p>
      <table className="recovered">
        <thead>
          <tr>
            <th scope="col">Recovered ({ROUTE_OPTIONS.find(([r]) => r === route)![1].toLowerCase()})</th>
            <th scope="col">kg</th>
            <th scope="col">Of what was there</th>
          </tr>
        </thead>
        <tbody>
          {ORDER.map((m) => {
            const ink = MATERIAL_INK[m]
            const rate = rates[ink as keyof typeof rates]
            return (
              <tr key={m} className={kg[m] ? undefined : 'lost'}>
                <th scope="row">
                  <Ink c={ink}>{NAMES[m]}</Ink>
                </th>
                <td>{kg[m] ? Math.round(kg[m]) : '–'}</td>
                <td>{rate ? `${Math.round(rate * 100)}%` : 'lost'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p>
        Much of the weight is ordinary metal: <Ink c="aluminium">aluminium</Ink>, <Ink c="copper">copper</Ink> and <Ink c="steel">steel</Ink> from the
        housing, wiring and foils. Switch routes and watch what disappears. The furnace routes keep the <Ink c="nickel">nickel</Ink> and <Ink c="cobalt">cobalt</Ink> but lose the{' '}
        <Ink c="lithium">lithium</Ink>, <Ink c="manganese">manganese</Ink> and <Ink c="graphite">graphite</Ink> to slag and smoke. Only the mechanical route
        recovers all of them.
      </p>
      <p>
        In total that’s {Math.round(RECOVERY_TOTAL.pyro.value * 100)}% of the pack by mass for the pyrometallurgical route,{' '}
        {Math.round(RECOVERY_TOTAL.thermal.value * 100)}% for thermal-mechanical and {Math.round(RECOVERY_TOTAL.mechanical.value * 100)}% for mechanical. The
        EU’s legal minimum is 50%, so all three pass (<Cite source="blomeke2022">Blömeke et al. 2022</Cite>). Now for the question that matters for the climate:
        does recovering all this save more carbon than the recycling emits?
      </p>
    </Chapter>
  )
}
