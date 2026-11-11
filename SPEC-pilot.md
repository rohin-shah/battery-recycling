# Pilot figure spec: the pH sweep

Draft for Rohin to correct. Nothing is built until this and a still are approved.

## Learning goal

Making the acid solution less acidic makes the dissolved metals settle out in a fixed order: impurities first, then the valuable metals together, ready to become new cathode material. Lithium stays dissolved to the end.

## What the reader changes

One slider: **pH**, from 1 to 11. Nothing else. No play button, no timeline.

The sentence beside it: "Drag the pH up. Watch which metals leave the solution, and what you lose if you rush past pH 4."

## What is in frame (fixed isometric view, dark panel)

- **Left: the diorama.** One glass beaker on a small slab, part-filled with solution. Ions drift in the liquid as small coloured beads. As pH rises, beads of each metal sink and settle as a layer of solid on the bottom: first a rust-and-white sludge (iron, aluminium), then a green-pink layer (nickel, cobalt, manganese). Lithium beads keep drifting. The number of beads of each metal still drifting matches the chart.
- **Right: the linked chart.** One line per metal: % still dissolved against pH. A marker rides each line at the current pH. Line colours match bead colours.
- **Labels.** Boxed capitals with thin leader lines, in a column: IRON + ALUMINIUM SLUDGE, MIXED NICKEL–COBALT–MANGANESE HYDROXIDE, LITHIUM (STILL DISSOLVED), plus two readouts: IMPURITIES REMOVED %, NICKEL + COBALT LOST WITH THEM %.
- On a phone the chart sits under the diorama.

Every bead and every label is there from the start. Nothing appears or disappears; beads only move between "drifting" and "settled".

## What the reader should notice

1. **Around pH 4** the iron and aluminium are almost all out, and little nickel or cobalt has gone with them (measured: 97.5% iron, 98.5% aluminium, 9% nickel, 2% cobalt).
2. **Pushing on to 5.5** before filtering costs valuable metal (measured: 57% nickel, 25% cobalt lost into the sludge).
3. **From about 6.5 to 10.5** the nickel, cobalt and manganese come out together. They don't separate cleanly, and for making new cathode material they don't need to.
4. **Lithium** never settles; it is recovered afterwards as lithium carbonate.

## Data

| Range | Source | Kind |
|---|---|---|
| pH 3.5–5.5: iron, aluminium, nickel, cobalt, manganese, lithium | Chernyaev, Wilson & Lundström (2021), Scientific Reports 11, 23283, Fig. 1b (NaOH, 60 °C, 4 g/L Al). CC BY 4.0 | Measured; values read off the chart, about ±2 points |
| pH 6–10.5: nickel, cobalt, manganese | Solubility products from Martell & Smith (1976), at the concentrations of an NMC-type solution (Chernyaev et al. 2023) | Calculated, 25 °C; ignores co-precipitation |
| Route and end point (mixed Ni–Co–Mn precipitate, about pH 10.4; lithium carbonate after) | Dittmer et al. (2026), Waste Management 211, 115283. CC BY 4.0 | Stated |

Where the measured loss at a pH is larger than the calculated value, the measured one is used.

## What the page must say

- Between pH 6 and 10 the curves are calculated, not measured.
- Copper is taken out in an earlier step, so it isn't on the slider.
- The measured part comes from a cobalt-rich test solution, not an exact NMC mix.
- The study behind the site's climate numbers (Blömeke 2022) separates the metals with solvents instead. This figure shows a different, real route.
- The solid is "the mixed metals that new cathode material is made from", not finished pCAM.

## Decided (11 Nov 2026)

- **Two figures.** Figure A: pH 1 to 5.5, the impurity window. The sludge is then filtered off, and the text says so. Figure B: pH 5.5 to 11 on the filtered solution, ending with the mixed nickel–cobalt–manganese solid and lithium still dissolved.
- **Art style:** smooth stylised 3D in a fixed isometric view, on a dark panel.
- **Slider wording:** "more acidic ↔ less acidic", with the pH number alongside.
- **Wording:** metals "dissolve" in acid and "settle out" as the solution gets less acidic; never "come out".

## The idea underneath (from Rohin, 11 Nov 2026)

Each dissolved metal ion bonds with the partner it "prefers". That preference is how chemistry pulls one metal out of a mixture: hydroxide grabs iron and aluminium before nickel and cobalt; in the oil step, an extractant molecule grabs one metal and leaves the rest. The figures should show the bonding itself (which ion pairs with what, and in what order), not only beads sinking. Rohin's rare-earth model is the pattern: one balanced reaction per step.

## Decided later (11 Nov 2026)

- Equations sit behind a "Show the equations" toggle.
- A small first figure shows the acid dissolving the powder (not built yet).
- Hydroxide beads were tried in Figure A and removed (Rohin: too complicated). The bonding lives in the equations toggle and the text only. For the record: nickel, cobalt and lithium losses are co-precipitation (Chernyaev 2021), so they sink without hydroxide.

## Still open

- Whether each figure also shows the reagents used and the carbon they add.
