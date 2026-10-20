import { useState } from 'react'
import { DisassemblyFigure } from '../figures/DisassemblyFigure'
import { Figure } from '../figures/Figure'
import { PROCESS } from '../model/data'
import { Steps } from '../ui/controls'
import { Num } from '../ui/Num'
import { Chapter, Cite, Ink } from './Chapter'

const STEPS = ['Arrives', 'Discharged', 'Opened up']
const { residualEnergy, peripheryShare, disassemblyHours } = PROCESS

export function Disassembly() {
  const [step, setStep] = useState(0)
  return (
    <Chapter
      title="First, make it safe and take it apart"
      figure={
        <Figure
          label={`A battery pack, ${STEPS[step].toLowerCase()}`}
          caption={<Steps label="Step" steps={STEPS} value={step} onChange={setStep} />}
        >
          <DisassemblyFigure step={step} />
        </Figure>
      }
    >
      <p>
        A spent pack still holds charge. In the model used here it arrives with about <Num v={residualEnergy}>{residualEnergy.value} kWh</Num> left, roughly a third of its capacity (
        <Cite source="blomeke2022">Blömeke et al. 2022</Cite>). That figure is an assumption, but no pack arrives empty.
      </p>
      <p>
        So packs are first <Ink c="energy">deep-discharged</Ink>, which deactivates the cells and recovers the energy rather than wasting it. Then two workers
        spend about{' '}
        <Num v={disassemblyHours}>{disassemblyHours.value} hours</Num> taking the pack apart by hand.
      </p>
      <p>
        Off comes the <Ink c="casing">aluminium and steel housing</Ink>, the battery management <Ink c="copper">electronics</Ink>, cables and connectors. These
        go to existing scrap recycling. They’re about <Num v={peripheryShare}>{Math.round(peripheryShare.value * 100)}%</Num> of the pack’s mass, so a third of the job is done before any
        chemistry starts.
      </p>
      <p>
        What’s left is the <Ink c="cell">modules</Ink>, and the valuable part is inside their cells: the cathode and anode coatings that hold the nickel,
        cobalt, manganese, lithium and graphite. Getting at those is where the three routes part ways.
      </p>
    </Chapter>
  )
}
