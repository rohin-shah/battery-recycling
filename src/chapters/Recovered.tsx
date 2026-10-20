import { useState } from 'react'
import { Figure } from '../figures/Figure'
import { MATERIAL_INK, ORDER, RecoveredFigure } from '../figures/RecoveredFigure'
import { DEFAULTS, derived, EU_MINIMUM, RECOVERED, RECOVERY_RATE, RECOVERY_TOTAL, ROUTES, type Material, type RouteId, type Value } from '../model/data'
import { packMass } from '../model/engine'
import { Choice } from '../ui/controls'
import { Num } from '../ui/Num'
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
const massKg = derived(massT * 1000, 'kg', 'Pack mass scaled from Blömeke’s 576 kg, 95 kWh pack (Table 2)')
const rateValue = (value: number): Value => ({ value, unit: 'share recovered', source: 'blomeke2022', how: 'stated', where: 'Fig. 7' })
const pct = (v: Value) => <Num v={v}>{Math.round(v.value * 100)}%</Num>

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
        Here is what comes out of a <Num v={DEFAULTS.packKwh}>{DEFAULTS.packKwh.value} kWh</Num> pack (about <Num v={massKg}>{Math.round(massT * 1000)} kg</Num>), by route (
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
                <td>{kg[m] ? <Num v={derived(kg[m], 'kg', `Table 3: ${RECOVERED[route][m]!.value} kg per tonne of battery × ${massT.toFixed(3)} t`)}>{Math.round(kg[m])}</Num> : '–'}</td>
                <td>{rate ? pct(rateValue(rate)) : 'lost'}</td>
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
        In total that’s {pct(RECOVERY_TOTAL.pyro)} of the pack by mass for the pyrometallurgical route, {pct(RECOVERY_TOTAL.thermal)} for
        thermal-mechanical and {pct(RECOVERY_TOTAL.mechanical)} for mechanical. The EU’s legal minimum is {pct(EU_MINIMUM)}, so all three pass (<Cite source="blomeke2022">Blömeke et al. 2022</Cite>). Now for the question that matters for the climate:
        does recovering all this save more carbon than the recycling emits?
      </p>
    </Chapter>
  )
}
