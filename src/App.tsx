import { lazy, type ReactNode, Suspense } from 'react'
import { SOURCES, type SourceId } from './sources'

// The figures bring three.js with them, so they load after the text.
const figure = (name: 'DissolveFigure' | 'ImpurityFigure' | 'MixedFigure') => lazy(() => import('./hydromet/Figures').then((m) => ({ default: m[name] })))
const DissolveFigure = figure('DissolveFigure')
const ImpurityFigure = figure('ImpurityFigure')
const MixedFigure = figure('MixedFigure')

const Figure = ({ children }: { children: ReactNode }) => <Suspense fallback={<div className="hm-loading" />}>{children}</Suspense>

export default function App() {
  return (
    <main>
      <h1>End of life in your EV</h1>
      <p>
        Your battery might be considered spent when it has less than 80% of the energy it once could, i.e., it
        becomes less and less usable as a means to move things. Ideally, the battery might be taken straight out of your car—physically unplugged,
        unbolted and replugged and bolted into an energy storage facility. That’s because storing energy and releasing it doesn’t have to be as
        demanding as something moving humans and things about. This process can genuinely work as one Californian
        study showed—particularly if similar batteries are grouped.
      </p>

      <h2>Why do lithium-ion batteries die?</h2>
      <p>
        A battery works by shuttling lithium back and forth between its two sides. When you charge a battery, this forces lithium ions to find a place
        on one side (the anode). Think of the graphite anode like a sponge where the lithium ions fill the gaps. The ions are then released to the
        other side, generating electricity. A battery fades in three main ways.
      </p>
      <ul>
        <li>
          Lithium gets locked away: every charge, a little lithium reacts and forms a crust on the anode (sponge side) of the battery meaning that the
          ion can never move again.
        </li>
        <li>If you charge too fast or too cold, lithium ions can coat the anode instead of being stored on that side, some of them permanently.</li>
        <li>The anode breaks up: the particles that hold lithium swell and shrink every cycle until they crack, leaving fewer places for lithium to sit.</li>
      </ul>
      <p>
        In each scenario, nothing has left the battery: every atom of metal is still in there but perhaps not in the right place or performing the
        best function.
      </p>

      <h2>Okay but what happens when it can’t store enough energy to be useful as energy storage?</h2>
      <p>
        Then it has to be recycled–it’s law in lots of places. The good thing
        about that is that humans have gotten quite good at recycling batteries.
      </p>

      <h3>Collection and dismantling</h3>
      <p>
        This stage might be overlooked often but a battery can only be recycled if it arrives at a recycling facility in the first place, i.e., it has
        been collected properly. There, the battery packs are physically dismantled. This is mostly done by humans today, with robots being piloted,
        and very much depends on where in the world and the type of battery that it is.
      </p>

      <h3>What are batteries made of at this point?</h3>
      <p>
        Batteries constitute an array of modules which constitute an array of cells. Cells are made of a mixture
        of chemicals like nickel, cobalt, manganese, lithium, iron, aluminium, copper, plastics and carbon. These
        early stages of the recycling process are designed to clean the cells as much as possible to isolate the things that we really want to
        recover—i.e., the metals. “Things we really want to recover” is largely driven by market forces: it’s what is economical to recover, not
        necessarily what’s best for the environment.
      </p>

      <h3>Shredding</h3>
      <p>
        The cells are then shredded into a metal powdery mix. In some plants the flammable parts of the cell are burned off first. The copper foil, aluminium foil and plastic is relatively easily mechanically recovered at this point: magnets pull
        out the steel, air jets separate light pieces from heavy ones and a sieve lets the fine powder through while holding back the flakes of foil
        and plastic. There are four separated products at this stage: the shredded metals “black mass”, the plastics, the
        shredded copper &amp; aluminium foil and the steel. The black mass is the thing that contains the metals that make lithium ion batteries worth
        recycling: cobalt, lithium, nickel etc.
      </p>

      <h3>Hydrometallurgy</h3>
      <h4>A brief introduction to hydrometallurgy</h4>
      <p>
        Why it’s called hydrometallurgy can be slightly unintuitive: “hydro” means water; everything here happens with the metals dissolved in a liquid
        that’s essentially spicy water. Acids can be thought of as water with extra hydrogen ions floating about. Add some acid to the water to spice
        it up and see what happens.
      </p>
      <Figure>
        <DissolveFigure />
      </Figure>

      <h4>The process</h4>
      <p>
        The black mass is subjected to a series of steps. Firstly it’s bathed in warm acid. This dissolves all of the metals. Graphite and other
        impurities don’t dissolve so can be filtered off. This is because the metals are generally bonded to oxygen. The oxygen atoms love that there
        are all those hydrogen ions floating about, and split up from the metal—leaving the metal floating about (dissolved) with new water molecules
        instead. The carbon in the graphite is largely unfazed by the hydrogen so it stays as graphite. Here’s an acidic solution with metals
        dissolved. Adjust the acidity by adding sodium hydroxide and watch how it splits and makes new water + metallic hydroxides. Find the sweet spot
        to isolate the iron and aluminium.
      </p>
      <Figure>
        <ImpurityFigure />
      </Figure>
      <p>
        Then the metal containing acid is purified using sodium hydroxide to grab the aluminium, and iron is added to trade places with copper. This is
        almost entirely efficient: about 98% of the iron and aluminium is removed, though about 9% of the nickel goes with them. Adding sodium
        hydroxide is like adding half of water. This means any hydrogen floating about is very attracted to it and makes more water—and therefore less
        acid which can hold less dissolved metal. Once the hydrogen is used up, the hydroxide grabs the metal ions instead, making solid metal
        hydroxides that settle out.
      </p>
      <p>
        The less metal containing acid still has lithium, nickel, cobalt and manganese in it. These are extracted by adding sodium hydroxide and
        carbonate. A US national lab model, based on what commercial plants achieve, puts this stage at 98% for the nickel, cobalt and manganese and 90%
        for the lithium. Real plants differ in the order and method of these steps. We’re now left with a waste water containing sodium sulfate that
        is relatively inert. The water is often evaporated off leaving behind the salt. Use the slider to add hydroxide ions through sodium hydroxide
        to neutralise the acid and settle out the nickel, cobalt and manganese.
      </p>
      <Figure>
        <MixedFigure />
      </Figure>

      <h3>What next?</h3>
      <p>
        Well now we’re left with the metals to make fresh batteries—and most of the mass of the valuable metals that we started with in a battery. These are made into brand-new cells so the new battery starts with all of its lithium free to move again.
      </p>

      <h3>What did we lose?</h3>
      <p>
        We often lose plastics, graphite and some lithium in the initial processing and throughout. Unfortunately, these aren’t economic to recover at
        a quality good enough to put into batteries. The graphite that is recovered is contaminated with metals, liquid and
        glue, so it isn’t battery-grade.
      </p>

      <h2>What about the environment then?</h2>
      <p>
        Minviro’s whitepaper on the topic showed that the climate change impacts of recycled battery-grade nickel sulfate are lower than that of it
        produced using the dominant mining process. This can be as little as 1/5th of the impact to around 1/3rd. It’s not a
        clear cut story for all metals, lithium is more varied when considering climate change impact alone—but this ignores things like water use.
      </p>

      <h2>Sources</h2>
      <ul className="sources">
        {(Object.keys(SOURCES) as SourceId[]).map((id) => (
          <li key={id} id={`source-${id}`}>
            <b>{SOURCES[id].short}:</b> {SOURCES[id].full} {SOURCES[id].url && <a href={SOURCES[id].url}>{SOURCES[id].url}</a>}
          </li>
        ))}
      </ul>
    </main>
  )
}
