import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import './pilot.css'
import { PilotA } from './PilotA'

// Local preview of the pilot figure only (pilot.html); not part of the site build.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main>
      <h2>Clearing out the impurities</h2>
      <p>Make the solution less acidic. Watch the iron and aluminium settle out first, and what happens to the nickel and cobalt if you go past pH 4.</p>
      <PilotA />
      <p className="hint">
        Measured values: Chernyaev, Wilson &amp; Lundström (2021), Scientific Reports 11, 23283, CC BY 4.0. The nickel, cobalt and lithium that sink here are dragged down with the sludge. Bead counts are illustrative. Copper is removed in an
        earlier step.
      </p>
    </main>
  </StrictMode>,
)
