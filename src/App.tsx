import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { calculate } from './model/engine'
import { Cite } from './chapters/Chapter'
import { Method } from './Method'
import { derived, PACK, RECOVERY_TOTAL, REGIONS, ROUTES, type RegionId, type RouteId } from './model/data'
import { type Build, fromQuery, GUESSES, type Guess, LIMITS, toQuery } from './share'
import { Choice, Slider } from './ui/controls'
import { Num } from './ui/Num'

const t = (v: number) => `${v.toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} t`
const pct = (v: number) => `${Math.round(v)}%`
const range = (k: keyof typeof LIMITS) => ({ min: LIMITS[k][0], max: LIMITS[k][1], step: LIMITS[k][2] })

const Chapters = lazy(() => import('./chapters/Chapters'))
const Intro = lazy(() => import('./chapters/Intro'))

const REVEAL: Record<Guess, string> = {
  landfill: 'That’s against the law in the UK. EV batteries may not be landfilled.',
  burned: 'That’s against the law in the UK. EV batteries may not be burned.',
  recycled: 'Close. It is recycled in the end, but reusing it for storage first saves more greenhouse gas.',
  reused: 'Right. Reusing it for storage first saves the most greenhouse gas, and then it’s recycled.',
}

const ROUTE_OPTIONS = Object.entries(ROUTES) as [RouteId, string][]
const REGION_OPTIONS = (Object.keys(REGIONS) as RegionId[]).map((r): [RegionId, string] => [r, REGIONS[r].name])

export default function App() {
  const [build, setBuild] = useState<Build>(() => fromQuery(window.location.search))
  const [copied, setCopied] = useState(false)
  const set = (patch: Partial<Build>) => setBuild((b) => ({ ...b, ...patch }))

  const link = `${window.location.origin}${window.location.pathname}?${toQuery(build)}`
  useEffect(() => window.history.replaceState(null, '', link), [link])

  const r = useMemo(() => calculate(build), [build])
  const scale = Math.max(r.process, r.credit)

  const share = async () => {
    const text = 'Your EV battery isn’t going in the bin. So what happens to it?'
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
        <h1>Your battery isn’t going in the bin.</h1>
        <p>
          UK law stipulates that your EV battery won’t go to the bin when it has served its purpose in your car (
          <Cite source="wbar2009">Waste Batteries and Accumulators Regulations 2009, reg. 56</Cite>).
        </p>
      </header>
      <Suspense fallback={null}>
        <Intro part="ageing" />
      </Suspense>

      <section className="card" aria-labelledby="guess-h">
        <h2 id="guess-h">If it’s not going in the bin, what happens to it?</h2>
        <Choice label="My guess" value={build.guess ?? ('' as Guess)} options={Object.entries(GUESSES) as [Guess, string][]} onChange={(guess) => set({ guess })} />
        {build.guess && <p className="hint">Locked in. The answer is at the end.</p>}
      </section>
      <Suspense fallback={null}>
        <Intro part="funnel" />
      </Suspense>

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
        <Choice label="Where the metals are separated" value={build.region} options={REGION_OPTIONS} onChange={(region) => set({ region })} />
        <aside className="note">
          <strong>Where UK batteries go.</strong> The UK doesn’t yet have a large plant that can turn black mass into pure metals. UK batteries are
          discharged, taken apart and shredded here, and the black mass is shipped abroad (<Cite source="dbt2025">DBT 2025</Cite>), mostly to Asia (
          <Cite source="faraday2024">Faraday Institution 2024</Cite>). South Korea, where recyclers such as SungEel HiTech do this, is the default. Both
          sources are government and industry reports, not peer-reviewed studies.
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
        <p className="caption">Tonnes of greenhouse gases (as CO₂e) for this battery. “Avoided” assumes the recycled metals are used instead of newly mined ones.</p>
      </section>

      {build.guess !== null && (
        <section className="card reveal" aria-live="polite">
          <h2>So what does happen to it?</h2>
          <p>
            You picked <strong>“{GUESSES[build.guess]}”</strong>. {REVEAL[build.guess]}
          </p>
          <p>
            When it is recycled, the route chosen above saves{' '}
            <strong>
              <Num v={RECOVERY_TOTAL[build.route]}>{pct(RECOVERY_TOTAL[build.route].value * 100)}</Num>
            </strong>{' '}
            of the battery’s mass, about <Num v={derived(r.recoveredKg, 'kg', 'Pack mass × the route’s total recovery rate (Fig. 7)')}>{Math.round(r.recoveredKg)} kg</Num>.
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
