import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { calculate } from './model/engine'
import { DEFAULT_REGION, RECOVERY_TOTAL, REGIONS, ROUTES, type RegionId, type RouteId } from './model/data'
import { type Build, fromQuery, LIMITS, toQuery } from './share'
import { Choice, Slider } from './ui/controls'

const t = (v: number) => `${v.toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} t`
const pct = (v: number) => `${Math.round(v)}%`
const range = (k: keyof typeof LIMITS) => ({ min: LIMITS[k][0], max: LIMITS[k][1], step: LIMITS[k][2] })

const Chapters = lazy(() => import('./chapters/Chapters'))

const ROUTE_OPTIONS =Object.entries(ROUTES) as [RouteId, string][]
const REGION_OPTIONS = (Object.keys(REGIONS) as RegionId[]).map((r): [RegionId, string] => [r, REGIONS[r].name])

export default function App() {
  const [build, setBuild] = useState<Build>(() => fromQuery(window.location.search))
  const [draftGuess, setDraftGuess] = useState(build.guess ?? 50)
  const [copied, setCopied] = useState(false)
  const set = (patch: Partial<Build>) => setBuild((b) => ({ ...b, ...patch }))

  const link = `${window.location.origin}${window.location.pathname}?${toQuery(build)}`
  useEffect(() => window.history.replaceState(null, '', link), [link])

  const r = useMemo(() => calculate(build), [build])
  const scale = Math.max(r.process, r.credit)

  const share = async () => {
    const text = 'Think your EV battery goes to landfill? How much of it do you think comes back?'
    if (navigator.share) {
      // Cancelling the share sheet rejects; nothing to do.
      await navigator.share({ title: 'Where does your EV battery go?', text, url: link }).catch(() => {})
      return
    }
    await navigator.clipboard.writeText(link)
    setCopied(true)
  }

  return (
    <main>
      <header>
        <h1>Think your battery goes to landfill?</h1>
        <p>
          It can’t. In the UK, waste EV batteries may not be landfilled or incinerated (
          <a href="https://www.legislation.gov.uk/uksi/2009/890/regulation/56" target="_blank" rel="noreferrer">
            Waste Batteries and Accumulators Regulations 2009, reg. 56
          </a>
          ).
        </p>
      </header>

      <section className="card" aria-labelledby="guess-h">
        <h2 id="guess-h">So how much of it comes back?</h2>
        <Slider label="My guess, by mass" value={draftGuess} {...range('guess')} format={pct} onChange={setDraftGuess} />
        <button type="button" className="go" onClick={() => set({ guess: draftGuess })} disabled={build.guess === draftGuess}>
          {build.guess === null ? 'Lock in my guess' : build.guess === draftGuess ? 'Guess locked in' : 'Update my guess'}
        </button>
      </section>

      <Suspense fallback={null}>
        <Chapters />
      </Suspense>

      <section className="card" aria-labelledby="calc-h">
        <h2 id="calc-h">Your battery</h2>
        <Slider
          label="Pack size"
          value={build.packKwh}
          {...range('packKwh')}
          format={(v) => `${v} kWh`}
          hint={`About ${Math.round(r.massKg)} kg, scaled from a 95 kWh NMC pack`}
          onChange={(packKwh) => set({ packKwh })}
        />
        <Choice label="Recycling route" value={build.route} options={ROUTE_OPTIONS} onChange={(route) => set({ route })} />
        <Choice label="Where the metals are refined" value={build.region} options={REGION_OPTIONS} onChange={(region) => set({ region })} />
        {build.region === DEFAULT_REGION && <p className="hint">Most UK black mass is shipped to Asia, mainly South Korea, for refining today.</p>}
        <details>
          <summary>Advanced</summary>
          <Slider
            label="Recovered battery metals replace mined ones"
            value={build.substitution}
            {...range('substitution')}
            format={(v) => `${Math.round(v * 100)}%`}
            hint="100% means every tonne recovered avoids a tonne mined. Applies to nickel, cobalt, manganese, lithium and graphite."
            onChange={(substitution) => set({ substitution })}
          />
        </details>

        <div className="bars" role="img" aria-label={`Recycling emits ${t(r.process)} and avoids ${t(r.credit)} of CO₂e, a net ${r.net <= 0 ? 'saving' : 'cost'} of ${t(Math.abs(r.net))}`}>
          <Bar kind="process" label="Emitted by recycling" value={r.process} scale={scale} />
          <Bar kind="credit" label="Avoided by not mining" value={r.credit} scale={scale} />
          <Bar kind="net" label={r.net <= 0 ? 'Net saving' : 'Net emitted'} value={Math.abs(r.net)} scale={scale} />
        </div>
        <p className="caption">Tonnes of CO₂e for this pack. The avoided figure assumes recovered material replaces mined material.</p>
      </section>

      {build.guess !== null && (
        <section className="card reveal" aria-live="polite">
          <h2>How much comes back</h2>
          <p>
            You guessed <strong>{pct(build.guess)}</strong>. This route recovers <strong>{pct(RECOVERY_TOTAL[build.route].value * 100)}</strong> of
            the pack’s mass, about {Math.round(r.recoveredKg)} kg.
          </p>
        </section>
      )}

      <button type="button" className="go secondary" onClick={share}>
        {copied ? 'Link copied' : 'Share'}
      </button>
    </main>
  )
}

function Bar({ kind, label, value, scale }: { kind: 'process' | 'credit' | 'net'; label: string; value: number; scale: number }) {
  return (
    <div className={`bar ${kind}`}>
      <span className="bar-label">{label}</span>
      <span className="bar-track">
        <span className="bar-fill" style={{ width: `${(Math.max(0, value) / scale) * 100}%` }} />
      </span>
      <strong className="bar-value">{t(value)}</strong>
    </div>
  )
}
