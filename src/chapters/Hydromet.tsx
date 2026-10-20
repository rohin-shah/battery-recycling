import { useState } from 'react'
import { Figure } from '../figures/Figure'
import { HYDROMET_STEPS, HydrometFigure } from '../figures/HydrometFigure'
import { PROCESS } from '../model/data'
import { Steps } from '../ui/controls'
import { Chapter, Cite, Ink } from './Chapter'

const { digestion, leachPh, lithiumPrecipitation } = PROCESS

export function Hydromet() {
  const [step, setStep] = useState(0)
  return (
    <Chapter
      title="Why acid works so well"
      figure={
        <Figure
          label={`Metal ions in acid: ${HYDROMET_STEPS[step].toLowerCase()}`}
          caption={
            <>
              <Steps label="Step" steps={HYDROMET_STEPS} value={step} onChange={setStep} />
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
        Shredding and sieving sort material by size and density. That can’t pull nickel apart from cobalt: in black mass they’re mixed together in the same
        microscopic crystals. To separate them you have to take the crystals apart, atom by atom. That’s what hydrometallurgy does, and every route here
        finishes with it (<Cite source="blomeke2022">Blömeke et al. 2022</Cite>).
      </p>
      <p>
        <strong>Leaching.</strong> The black mass is heated with concentrated sulphuric acid to about {digestion.value} °C, turning its metals into
        sulphates, which then dissolve in water: a strongly acidic solution at about pH {leachPh.value}. The solid that was black mass is now a liquid in which
        every metal atom moves on its own, as an ion. Step the figure forward to see it.
      </p>
      <p>
        <strong>Removing impurities.</strong> Some of what dissolved isn’t wanted. Adding iron powder makes the <Ink c="copper">copper</Ink> come out as metal.
        Hydrogen peroxide and then sodium hydroxide raise the pH until <Ink c="iron">iron</Ink> and <Ink c="aluminium">aluminium</Ink> drop out as solid
        hydroxides that can be filtered off.
      </p>
      <p>
        <strong>Solvent extraction</strong> is the key step. An oily organic liquid that doesn’t mix with water is stirred in. It carries a molecule chosen to
        grab one metal: Cyanex 272 for <Ink c="cobalt">cobalt</Ink>, Cyanex 301 for cobalt and <Ink c="nickel">nickel</Ink>, D2EHPA for{' '}
        <Ink c="manganese">manganese</Ink>. The metal moves into the oil, the oil is separated off, and dilute acid strips the metal back out. Repeating this
        separates metals as alike as cobalt and nickel into high-purity streams, one metal each. The extractants are reused.
      </p>
      <p>
        <strong>Lithium comes last.</strong> What’s left is mostly <Ink c="lithium">lithium</Ink> in solution. It’s concentrated by evaporation, then sodium
        carbonate is added at about {lithiumPrecipitation.value} °C and lithium carbonate precipitates out.
      </p>
      <p>
        Finally each metal stream is crystallised into a sulphate salt. That’s why it works: physical sorting can only separate particles, but chemistry can
        separate atoms, so the products aren’t mixtures but pure salts, ready for making new battery materials.
      </p>
    </Chapter>
  )
}
