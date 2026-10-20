import { Figure } from '../figures/Figure'
import { BlackMassPlaceholder, IonPlaceholder } from '../figures/placeholders'
import { Stage } from '../figures/Stage'
import { Chapter } from './Chapter'
import { SecondLife } from './SecondLife'

/** The process chapters, loaded as their own chunk so the text above appears before three.js arrives. */
export default function Chapters() {
  return (
    <>
      <Stage />
      <SecondLife />
      <Chapter title="Placeholder: black mass" figure={<Figure label="A pile of shredded black mass" caption="Placeholder figure: 2,000 instanced flecks, to load-test the canvas."><BlackMassPlaceholder /></Figure>}>
        <p>Placeholder text. Shredding turns cells into a dark powder of electrode material.</p>
        <p>This figure is the heaviest of the three, to check that scrolling stays smooth.</p>
      </Chapter>
      <Chapter title="Placeholder: an ion in solution" figure={<Figure label="A metal ion surrounded by water molecules" caption="Placeholder figure: a recovered ion (lime) in solution."><IonPlaceholder /></Figure>}>
        <p>Placeholder text. In leaching, metal ions leave the solid and move into solution.</p>
        <p>This figure animates every frame, and stops drawing when scrolled off screen.</p>
      </Chapter>
    </>
  )
}
