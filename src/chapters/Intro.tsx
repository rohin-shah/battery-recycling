import { useEffect, useRef, useState } from 'react'
import { AGEING_STEPS, AgeingFigure, capacityAt } from '../figures/AgeingFigure'
import { Figure } from '../figures/Figure'
import { FunnelFigure } from '../figures/FunnelFigure'
import { Scrubber } from '../ui/controls'
import { Cite, Ink } from './Chapter'

/** The two figures above the chapters, in their own lazy chunk with three.js so the page text appears first. */
export default function Intro({ part }: { part: 'ageing' | 'funnel' }) {
  return part === 'ageing' ? <Ageing /> : <Funnel />
}

function Ageing() {
  const [progress, setProgress] = useState(0)
  return (
    <Figure
      label={`A cell’s insides as it ages: ${AGEING_STEPS[Math.round(progress)].toLowerCase()}`}
      caption={
        <>
          <Scrubber label="Age" steps={AGEING_STEPS} value={progress} onChange={setProgress} />
          <p className="legend" aria-live="polite">
            <Ink c="lithium">Charge it can hold: {Math.round(capacityAt(progress) * 100)}%</Ink>
          </p>
          <p className="hint">
            Every charge and discharge, a little lithium is trapped in a film that grows on the graphite, and some particles crack and lose contact, so the
            cell holds less (<Cite source="birkl2017">Birkl et al. 2017</Cite>). How much each one costs is illustrative.
          </p>
        </>
      }
    >
      <AgeingFigure progress={progress} />
    </Figure>
  )
}

/** Scroll progress through the figure: 0 as it enters at the bottom of the screen, 1 once it reaches the middle. */
function useScrollProgress() {
  const ref = useRef<HTMLDivElement>(null)
  const [p, setP] = useState(0)
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const r = ref.current?.getBoundingClientRect()
      if (r) setP(Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight * 0.6 + r.height * 0.5))))
    }
    const onScroll = () => (frame ||= requestAnimationFrame(update))
    update()
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll)
    return () => {
      removeEventListener('scroll', onScroll)
      removeEventListener('resize', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])
  return [ref, p] as const
}

function Funnel() {
  const [ref, progress] = useScrollProgress()
  return (
    <div ref={ref}>
      <Figure
        label="The waste hierarchy as a funnel: a used cell falls past prevention and lands on preparing for re-use"
        caption={
          <p className="hint">
            Scroll to drop the cell. The UK’s order of preference for dealing with waste, best at the top (
            <Cite source="wasteRegs2011">Waste Regulations 2011</Cite>).
          </p>
        }
      >
        <FunnelFigure progress={progress} />
      </Figure>
    </div>
  )
}
