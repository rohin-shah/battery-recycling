import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import { DissolveFigure, ImpurityFigure, MixedFigure } from '../hydromet/Figures'

// Local preview of the hydrometallurgy figures on their own (pilot.html); not part of the site build.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main>
      <h2>1. Dissolving</h2>
      <DissolveFigure />
      <h2>2. Clearing out the impurities</h2>
      <ImpurityFigure />
      <h2>3. The valuable metals</h2>
      <MixedFigure />
    </main>
  </StrictMode>,
)
