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
const ROUTE_OPTIONS = Object.entries(ROUTES) as [RouteId, string][]
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
        Here’s what comes out of a <Num v={DEFAULTS.packKwh}>{DEFAULTS.packKwh.value} kWh</Num> battery, which weighs about{' '}
        <Num v={massKg}>{Math.round(massT * 1000)} kg</Num> (<Cite source="blomeke2022">Blömeke et al. 2022</Cite>). Switch routes and watch what disappears.
        The metals come out as salts, so their masses include the other atoms in the salt and some water: a kilogram of{' '}
        <Ink c="nickel">nickel sulphate</Ink> contains much less than a kilogram of nickel.
      </p>
      <table className="recovered">
        <thead>
          <tr>
            <th scope="col">Saved by “{ROUTES[route]}”</th>
            <th scope="col">kg</th>
            <th scope="col">Share saved</th>
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
        Much of the weight is ordinary metal: <Ink c="aluminium">aluminium</Ink>, <Ink c="copper">copper</Ink> and <Ink c="steel">steel</Ink> from the case,
        wires and foils. The two routes that use a furnace keep the <Ink c="nickel">nickel</Ink> and <Ink c="cobalt">cobalt</Ink>, but lose the{' '}
        <Ink c="lithium">lithium</Ink>, <Ink c="manganese">manganese</Ink> and <Ink c="graphite">graphite</Ink>. Only shredding saves all of them.
      </p>
      <p>
        In total, melting saves {pct(RECOVERY_TOTAL.pyro)} of the battery by mass, baking then shredding {pct(RECOVERY_TOTAL.thermal)}, and shredding{' '}
        {pct(RECOVERY_TOTAL.mechanical)}. The legal minimum in the EU is {pct(EU_MINIMUM)}, so all three pass (<Cite source="blomeke2022">Blömeke et al. 2022</Cite>
        ). Now the question that matters for the climate: does saving all this avoid more carbon than the recycling itself gives off?
      </p>
    </Chapter>
  )
}
