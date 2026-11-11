# Battery recycling site: checklist

Revised 12 Nov 2026. The copy is final and the page and its three figures are built; what is left is review.

## 1. Review what was built overnight (needs Rohin)

Built on 11–12 Nov 2026 and committed locally; nothing is pushed, so the live site is unchanged.

- [ ] **Read the page.** `npm run dev`, then http://localhost:5173/. It is the Final Copy tab, with every old figure and the calculator removed.
- [ ] **Try the three figures** on desktop and on your phone:
  1. Acid dissolving the black mass (slider: acid strength; measured, Chen and Ho 2018).
  2. Clearing out the impurities (slider: pH 1–5.5; measured, Chernyaev 2021).
  3. Settling out nickel, cobalt and manganese (slider: pH 5.5–10.5; calculated).
- [ ] **Confirm the solubility constants for figure 3.** Nickel −15.2, cobalt −14.9, manganese −12.8 (log Ksp) were entered from memory of Martell & Smith; they need checking against the book or another published table.
- [ ] **Confirm the nickel claim in the environment paragraph.** "As little as 1/5th of the impact to around 1/3rd": the public whitepaper page gives no numbers, and the charts in the draft read nearer one-third to about equal, depending on the mined route.
- [ ] **Slips fixed in the copy** (say if any should go back):
  - "i.e., it makes it less and less usable" → "it becomes less and less usable"
  - "Why do Lithium Ion batteries die?" → "lithium-ion"
  - "unphased" → "unfazed"
  - "grab the Aluminium and iron is added" → "grab the aluminium, and iron is added"
  - "less acid which can hold less dissolved acid" → "less dissolved metal"
  - "nickel etc.." → "nickel etc."
  - Question marks added to two headings; "Collection and Dismantling" → "Collection and dismantling"
  - Citation added for the Minviro whitepaper.
- [ ] **Placement of the precipitation figures.** Your single marker became two figures: the impurity one after the purification paragraph, the nickel–cobalt–manganese one after the next paragraph.
- [ ] **Push when happy.** Pushing deploys to the live site.

## 2. Loose ends (Claude, on Rohin's say-so)

- [ ] **Citations not checked first-hand:** Blömeke's table and figure numbers, Dittmer 2026 for hydroxide settling, Birkl 2017, the Argonne second-life FAQ, NREL 2015.
- [ ] **Sources list** still includes Hanna 2025, Tao 2021 and Latini 2022, which the final copy no longer cites. Remove them or leave them.
- [ ] **Not checked on the figures:** reduced-motion setting, keyboard use of the sliders, a real phone (only phone width in the browser).
- [ ] **`motion` package** is no longer used and could be removed.

## Decided

- **Copy first, then figures.** Rohin handwrites; Claude redrafts with minimal changes and sources every claim.
- **A generic process, not one plant.** Each step must have its own published source, even if steps come from different papers. Numbers stay tied to the study they came from ("in one detailed study").
- **Chemistry:** NMC. Hydroxide and carbonate route in the copy (Chen and Ho 2018; Dittmer 2026). Blömeke's whole-plant figures (83% nickel, cobalt, manganese; 72% lithium; net 6.7 t CO₂e saved per tonne of pack) come from a plant that separates the metals with oils.
- **Recovery rates quoted both ways:** 98% and 90% at the chemistry stage (Argonne EverBatt), 83% and 72% from pack to product (Blömeke).
- **Dropped loose ends:** whether EV batteries count as "industrial" under UK rules; "relatively inert" for sodium sulfate stays as Rohin's wording.
- **Sources:** new ones are run by Rohin first. Confidential client reports are never used; only their published reference lists. PDFs stay out of the public repo.
- **Approved sources so far:** Blömeke 2022, Chernyaev 2021, Dittmer 2026, Birkl 2017, Wesselkämper 2025, Martell & Smith constants, Argonne second-life FAQ, Saxena 2015, NREL 2015, Lacap 2022 (UC Davis / CEC), Harper 2019, EU Regulation 2023/1542, UK SI 2009/890, Lee 2025, Fernandez-Torres 2012, Hanna 2025, Liu 2023, Tao 2021, Chen and Ho 2018, Latini 2022, Rey 2021, Dai 2019 (EverBatt).
- **Awaiting approval:** Lander 2021, IEA 2024, European Commission 2026 targets review, Perocillo 2025, Jung 2021, Li et al. 2026.
- **Figures:** proper 3D allowed; built in code with a look pass; dark panels on a light page; fixed isometric view; nothing spins, appears or disappears; reader controls a physical quantity; result computed from sourced data; one idea per figure; about three to five small figures per topic.
- **Style targets:** 3Blue1Brown (scene linked to chart), Into the Breach (fixed diorama), Teenage Engineering (boxed labels, one accent colour).
- **Pilot:** hydrometallurgy pH figure in two parts. A: impurity window, pH 1–5.5, measured. B: pH 5.5–11, calculated. Slider reads "more acidic ↔ less acidic" with the pH number. Metals "dissolve" and "settle out".
- **Ions in the figures (final copy, 11 Nov):** hydrogen ions and hydroxide ions are shown as small beads; they wait in a dosing tube and become water when they meet. Hydroxide is not drawn attached to each metal (tried earlier and dropped as too complicated); that bonding is behind the "Show the equations" toggle.
- **Rest of the page** stays as text.
- **Audience:** anyone who passed GCSE maths and science. Masses and percentages kept. British English.
