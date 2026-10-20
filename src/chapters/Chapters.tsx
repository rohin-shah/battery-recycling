import { Figure } from '../figures/Figure'
import { BlackMassPlaceholder, IonPlaceholder, PackPlaceholder } from '../figures/placeholders'
import { Stage } from '../figures/Stage'

/** The process chapters, loaded as their own chunk so the text above appears before three.js arrives. */
export default function Chapters() {
  return (
    <>
      <Stage />
      <Chapter title="Placeholder: the pack" figure={<Figure label="A battery pack: casing around eight modules" caption="Placeholder figure: casing (teal) around modules (sage)."><PackPlaceholder /></Figure>}>
        <p>Placeholder text. Each chapter pairs its prose with one figure that sits beside it on a wide screen and stays pinned above it on a phone.</p>
        <p>The figure adds a single concept to the one before, and can be turned by dragging sideways.</p>
      </Chapter>
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

function Chapter({ title, figure, children }: { title: string; figure: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="chapter">
      {figure}
      <div className="prose">
        <h2>{title}</h2>
        {children}
      </div>
    </section>
  )
}
