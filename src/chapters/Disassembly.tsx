import { useState } from 'react'
import { DISASSEMBLY_STEPS, disassemblyReadout, DisassemblyFigure } from '../figures/DisassemblyFigure'
import { Figure } from '../figures/Figure'
import { PROCESS } from '../model/data'
import { Scrubber } from '../ui/controls'
import { Num } from '../ui/Num'
import { Chapter, Cite, Ink } from './Chapter'

const { residualEnergy, peripheryShare, disassemblyHours } = PROCESS

export function Disassembly() {
  const [progress, setProgress] = useState(0)
  const { chargeLeft, removed } = disassemblyReadout(progress)
  return (
    <Chapter
      title="Make it safe, take it apart"
      figure={
        <Figure
          label={`A battery pack, ${DISASSEMBLY_STEPS[Math.round(progress)].toLowerCase()}`}
          caption={
            <>
              <Scrubber label="Step" steps={DISASSEMBLY_STEPS} value={progress} onChange={setProgress} />
              <p className="legend" aria-live="polite">
                <Ink c="energy">Charge left: {Math.round(residualEnergy.value * chargeLeft)} kWh</Ink>{' '}
                <Ink c="casing">Mass removed so far: {Math.round(peripheryShare.value * removed * 100)}%</Ink>
              </p>
              <p className="hint">
                Layout based on a real Nissan Leaf pack (<Cite source="leafPhotos">photos</Cite>); sizes are illustrative.
              </p>
            </>
          }
        >
          <DisassemblyFigure progress={progress} />
        </Figure>
      }
    >
      <ul>
        <li>
          <Ink c="energy">Discharge it.</Ink> The battery arrives still holding about <Num v={residualEnergy}>{residualEnergy.value} kWh</Num>, enough to be
          dangerous, so a cable drains it first (<Cite source="blomeke2022">Blömeke et al. 2022</Cite>).
        </li>
        <li>
          <Ink c="casing">Open it up.</Ink> Two workers spend about <Num v={disassemblyHours}>{disassemblyHours.value} hours</Num> taking off the case,
          electronics and cables by hand. These go to ordinary scrap recycling and make up{' '}
          <Num v={peripheryShare}>{Math.round(peripheryShare.value * 100)}%</Num> of the battery’s mass.
        </li>
        <li>
          <Ink c="cell">Keep the modules.</Ink> What’s left are boxes of cells holding the valuable metals: nickel, cobalt, manganese and lithium, plus
          graphite.
        </li>
      </ul>
    </Chapter>
  )
}
