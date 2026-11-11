import { useState } from 'react'
import { Figure } from '../figures/Figure'
import { HYDROMET_STEPS, HydrometFigure } from '../figures/HydrometFigure'
import { PROCESS } from '../model/data'
import { Scrubber } from '../ui/controls'
import { Num } from '../ui/Num'
import { Chapter, Cite, Ink } from './Chapter'

const { digestion } = PROCESS

export function Hydromet() {
  const [progress, setProgress] = useState(0)
  // The ions glide between states on their own, so the figure takes the nearest step.
  const step = Math.round(progress)
  return (
    <Chapter
      title="Why dissolving it works so well"
      figure={
        <Figure
          label={`Metal ions in acid: ${HYDROMET_STEPS[step].toLowerCase()}`}
          caption={
            <>
              <Scrubber label="Step" steps={HYDROMET_STEPS} value={progress} onChange={setProgress} />
              <p className="legend">
                <Ink c="nickel">nickel</Ink> <Ink c="cobalt">cobalt</Ink> <Ink c="manganese">manganese</Ink> <Ink c="lithium">lithium</Ink>{' '}
                <Ink c="iron">iron</Ink> <Ink c="aluminium">aluminium</Ink> <Ink c="copper">copper</Ink>
              </p>
            </>
          }
        >
          <HydrometFigure step={step} />
        </Figure>
      }
    >
      <p>
        Shredding and sieving can sort pieces by size and weight, but they can’t separate nickel from cobalt. In black mass, the metals are mixed together
        inside the same tiny crystals. To separate them, the crystals have to be broken down into single atoms. Dissolving them in acid does exactly that
        (hydrometallurgy), and every route finishes this way (<Cite source="blomeke2022">Blömeke et al. 2022</Cite>). Drag the slider to follow the metals.
      </p>
      <p>
        <strong>Dissolve.</strong> The black mass is heated with strong sulphuric acid to about <Num v={digestion}>{digestion.value} °C</Num>, then mixed with
        water. The metals dissolve, like sugar in tea. Each metal atom is now a separate ion, free to move about in the liquid.
      </p>
      <p>
        <strong>Remove what isn’t wanted.</strong> Adding iron powder makes the <Ink c="copper">copper</Ink> come out as solid metal. Then the{' '}
        <Ink c="iron">iron</Ink> and <Ink c="aluminium">aluminium</Ink> are made to form solids too, which are filtered off.
      </p>
      <p>
        <strong>Pick out each metal.</strong> This is the clever bit. An oil that doesn’t mix with water is stirred in, carrying a chemical that grabs one
        particular metal and ignores the rest. One oil picks up the <Ink c="cobalt">cobalt</Ink>, another the <Ink c="nickel">nickel</Ink>, another the{' '}
        <Ink c="manganese">manganese</Ink>. Each oil is then separated off, the metal is washed back out of it, and the oil is used again.
      </p>
      <p>
        <strong>Lithium last.</strong> Mostly <Ink c="lithium">lithium</Ink> is left in the water. Adding sodium carbonate turns it into lithium carbonate, a
        white solid that settles out.
      </p>
      <p>
        That’s why it works. Sieves can only separate bits; chemistry can separate atoms. So what comes out isn’t a mixture but pure metal salts, good enough
        to make new batteries.
      </p>
    </Chapter>
  )
}
