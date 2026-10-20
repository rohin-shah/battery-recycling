import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { calculate } from './model/engine'
import { Cite } from './chapters/Chapter'
import { Method } from './Method'
import { derived, PACK, RECOVERY_TOTAL, REGIONS, ROUTES, type RegionId, type RouteId } from './model/data'
import { type Build, fromQuery, LIMITS, toQuery } from './share'
import { Choice, Slider } from './ui/controls'
import { Num } from './ui/Num'

const t = (v: number) => `${v.toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} t`
const pct = (v: number) => `${Math.round(v)}%`
const range = (k: keyof typeof LIMITS) => ({ min: LIMITS[k][0], max: LIMITS[k][1], step: LIMITS[k][2] })

const Chapters = lazy(() => import('./chapters/Chapters'))

const ROUTE_OPTIONS = Object.entries(ROUTES) as [RouteId, string][]
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
          <Cite source="wbar2009">Waste Batteries and Accumulators Regulations 2009, reg. 56</Cite>).
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
          hint={
            <>
              About <Num v={derived(r.massKg, 'kg', 'Scaled linearly from Blömeke’s 576 kg, 95 kWh pack (Table 2)')}>{Math.round(r.massKg)} kg</Num>, scaled from a{' '}
              <Num v={PACK.capacity}>95 kWh</Num> NMC pack
            </>
          }
          onChange={(packKwh) => set({ packKwh })}
        />
        <Choice label="Recycling route" value={build.route} options={ROUTE_OPTIONS} onChange={(route) => set({ route })} />
        <Choice label="Where the metals are refined" value={build.region} options={REGION_OPTIONS} onChange={(region) => set({ region })} />
        <aside className="note">
          <strong>Where UK black mass goes.</strong> No UK plant refines black mass at commercial scale yet. Batteries recycled in the UK are discharged,
          dismantled and shredded here, and the black mass is exported for refining (<Cite source="dbt2025">DBT 2025</Cite>), mostly to Asia (
          <Cite source="faraday2024">Faraday Institution 2024</Cite>). South Korea, home to hydrometallurgical recyclers such as SungEel HiTech, is the
          default here. Both are government and industry reports, not peer-reviewed studies.
        </aside>
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

        <div className="bars">
          <Bar kind="process" label="Emitted by recycling" value={r.process} scale={scale} note="Blömeke’s process emissions for this route (Fig. 8c), scaled to your pack, with its electricity (Table 3) moved to the chosen grid (Ember)" />
          <Bar kind="credit" label="Avoided by not mining" value={r.credit} scale={scale} note="Recovered mass (Table 3) × carbon of the primary material it replaces (Table SM.6.1), scaled to your pack" />
          <Bar kind="net" label={r.net <= 0 ? 'Net saving' : 'Net emitted'} value={Math.abs(r.net)} scale={scale} note="Emitted minus avoided" />
        </div>
        <p className="caption">Tonnes of CO₂e for this pack. The avoided figure assumes recovered material replaces mined material.</p>
      </section>

      {build.guess !== null && (
        <section className="card reveal" aria-live="polite">
          <h2>How much comes back</h2>
          <p>
            You guessed <strong>{pct(build.guess)}</strong>. This route recovers{' '}
            <strong>
              <Num v={RECOVERY_TOTAL[build.route]}>{pct(RECOVERY_TOTAL[build.route].value * 100)}</Num>
            </strong>{' '}
            of the pack’s mass, about <Num v={derived(r.recoveredKg, 'kg', 'Pack mass × the route’s total recovery rate (Fig. 7)')}>{Math.round(r.recoveredKg)} kg</Num>.
          </p>
        </section>
      )}

      <Method />

      <button type="button" className="go secondary" onClick={share}>
        {copied ? 'Link copied' : 'Share'}
      </button>
    </main>
  )
}

function Bar({ kind, label, value, scale, note }: { kind: 'process' | 'credit' | 'net'; label: string; value: number; scale: number; note: string }) {
  return (
    <div className={`bar ${kind}`}>
      <span className="bar-label">{label}</span>
      <span className="bar-track">
        <span className="bar-fill" style={{ width: `${(Math.max(0, value) / scale) * 100}%` }} />
      </span>
      <strong className="bar-value">
        <Num v={derived(value, 't CO₂e', note)}>{t(value)}</Num>
      </strong>
    </div>
  )
}
