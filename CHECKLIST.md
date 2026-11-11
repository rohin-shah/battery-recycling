# Getting the simulations right: checklist

Work top to bottom. Each item says what you provide and what Claude does with it. Nothing new gets built until step 6.

## 1. Set the ceiling (decided 11 Nov 2026)

- [x] **Asset rule.** Proper 3D models are allowed.
- [x] **Count against quality.** Three figures, each excellent: (1) why batteries lose health, (2) how pyrometallurgy works, (3) how hydrometallurgy works.
- [x] **Geometry sources.** Any reference may be used for what things look like. Numbers stay peer-reviewed.
- [ ] **What happens to the rest of the page** (second life, taking the pack apart, the shred route, what comes back, the calculator): text only, or cut?

## Decided since (11 Nov 2026)

- [x] **Build route.** Figures built in code with a proper look pass (lighting, shadows, bevels, cutaways). Blender only if that falls short.
- [x] **Figure style.** The reader controls a physical quantity and the result is computed from sourced data; no multi-step timelines.
- [x] **Shape.** Each topic is a short sequence of three to five small figures, about 10 to 12 in total.
- [x] **Pilot (step 3).** The hydrometallurgy pH figure.
- [x] **PRD updated** with the revised approach.
- [x] **Targets received (step 2).** 3Blue1Brown (linked scene and chart), Into the Breach (fixed isometric diorama), Teenage Engineering (boxed labels with leader lines); annotated screenshot: flat, odd-looking ion textures.
- [x] **Dark figure panels**, on a light page.
- [x] **Pilot data approved.** Chernyaev 2021 (measured, pH 3.5–5.5), Dittmer 2026 (route and end point), Martell & Smith solubility constants (calculated, pH 6–10.5). Full pH sweep, ending in the mixed metals for new cathode material.
- [x] **Pilot spec (step 4).** In SPEC-pilot.md. Decided: two figures (A: impurity window, pH 1–5.5; B: pH 5.5–11 on the filtered solution), smooth stylised 3D, slider reads "more acidic ↔ less acidic" with the pH number.
- [x] **The idea underneath.** Ions bond with the partner they prefer; that selectivity is what the figures must show.
- [ ] **Approve a first look at Figure A (step 5).** Rough local preview built at pilot.html; still to add: the bonding partners (hydroxide) and the look you want.
- [x] **No hydroxide beads.** Tried in Figure A and removed as too complicated; the figure shows metals only.
- [x] **Equations.** Behind a "Show the equations" toggle on each figure.
- [x] **Dissolve figure.** Add a small first figure showing the acid dissolving the powder.
- [x] **Rest of the page.** Stays as text (no figures).
- [ ] **Open:** reagents used and carbon readout on each figure?

## 2. Show the target (references, ~20 minutes)

- [ ] **Two or three figures you love**, by link or screenshot, each with one line on why (cutaway, materials, labels, motion, what you can change).
  - Claude: writes down the common qualities as a short style brief for you to correct.
- [ ] **One annotated screenshot** of a current figure, marking what's wrong.
  - Claude: turns your marks into a list of rules to apply everywhere.

## 3. Pick the pilot figure (decision, ~5 minutes)

- [x] **Choose one figure** to build to a finished standard first: the hydrometallurgy pH figure.

## 4. Specify the pilot (one page, ~30 minutes, together)

- [ ] **Learning goal.** One sentence: what should the reader understand afterwards?
- [ ] **What the reader changes.** The parameter or control, and what it should reveal (not just a timeline).
- [ ] **What's in frame.** The object, the scale, and what stays fixed.
- [ ] **Storyboard.** A pen sketch of the start, middle and end frames; a phone photo is fine.
- [ ] **What to model.** Which real cell or pack.
  - Claude: drafts the whole one-page spec first (data sources included) for you to correct, so you react rather than write from scratch.

## 5. Agree the look before building (~15 minutes)

- [ ] **Approve a still.** Claude produces one static frame of the pilot in the target style.
- [ ] **Approve the interaction.** Claude produces a rough, ugly version that only shows the behaviour.

## 6. Build and review the pilot

- [ ] **Claude builds it**; you review on your phone and desktop.
- [ ] **Feedback as annotated screenshots or a screen recording**, until you're happy.
- [ ] **Write down what made it good**: this becomes the bar for every other figure.

## 7. Roll out

- [ ] **Repeat steps 4 to 6** for each remaining figure, in page order.
- [ ] **Handwrite the copy** per section in the skeleton doc; Claude applies it and checks every number against its source.

## Parked until the pilot is approved

- Committing the current uncommitted work (GCSE rewrite, fixed views, new figures).
- Fixing clutter in the current figures.
- Chapters 1, 4 and 5, which still break the "nothing appears or disappears" rule.
