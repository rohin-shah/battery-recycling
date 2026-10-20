# EV Battery Recycling: Build Plan

PRD: "20261012 EV Emissions" Google Doc, Metals Recycling tab (private).

## What we're building

A long-form, interactive explainer for readers with A-level STEM. It follows a spent UK EV battery from the car to recovered salts, explains why hydrometallurgy works at the level of ions, then lets readers compare the climate-change impact of recycling routes for their own pack. Every number is sourced. The site is standalone, links both ways with evorpetrol.co.uk, and is published once, when every chapter is finished.

Out of scope: economics, other impact categories, landfill as an option, a simplified mode, fallbacks without WebGL, uncertainty bands, and direct recycling in the calculator (prose mention only).

## Decisions

| Area | Decision |
|---|---|
| Hook | "Think your battery goes to landfill?" (it can't, by UK law), then a guess slider: "…so how much of it comes back?". The guess is revealed after the LCA and is carried in the share link |
| Order | Hook → process chapters → LCA calculator and reveal → How this was counted |
| Impact | Climate change only, GWP100, **tonnes CO₂e to 1 decimal place** |
| System model | Avoided burden. Process, credit and net are always shown separately; the credit is labelled as an assumption |
| Unit | Per pack. Default is 60 kWh, with mass scaled linearly from Blömeke's pack (576 kg / 95 kWh ≈ 6.1 kg/kWh, so ≈ 364 kg). The scaling is labelled as an assumption |
| Chemistries | NMC (pouch) only, from Blömeke. LFP is dropped: the sources can't model it at pack level without stacking assumptions. "How this was counted" says so in one line; the second-life chapter may still mention Wesselkämper's "LFP to second life" |
| Material factors | Blömeke's (ecoinvent 3.8) throughout; the disagreement with other studies (e.g. cobalt sulphate) is noted in "How this was counted" |
| Routes | Blömeke 2022: (1) pyro + hydro, (2) mechanical + hydro, (3) thermal-mechanical + hydro |
| Region | Pretreatment (discharge, dismantling, shredding to black mass) is fixed in the UK. Reader chooses where hydromet happens; default **South Korea**, where most UK black mass goes today. Method: swap Blömeke's electricity (stated kWh/t per route: 1,564 / 692 / 656, at 0.366 kg/kWh German grid) for the destination grid's intensity. Both sides use Ember (CC BY 4.0, life-cycle, per kWh generated): remove at Germany 2020 (356 g), add at the destination's 2025 value (UK 217, South Korea 417, China 526, EU 209, US 384). Location moves results only 2–10%, and the page says so. A grey-literature box (DBT/Frazer-Nash 2025, Faraday Insights 20) explains the UK has no commercial hydromet yet |
| Substitution | Advanced slider, default 1 (Blömeke sensitivities: 0.75 → +20%, 0.5 → +41% recycling GWP) |
| Second life | Process chapter before recycling. One sourced result: Wesselkämper 2025's own California model to 2050, where second use first saved more than recycling straight away in every scenario (55.8 vs 48.3 Mt CO₂e). Its cited 45–70 kg CO₂e/kWh is not used (derived from a secondary review with a broken citation). Not in the calculator |
| Data values | From the supplementary files first. Values read off charts are labelled "chart-read" |
| Simulations | Illustrative and interactive (drag, rotate, scrub). Real numbers only where sourced, e.g. mass flows and recovery rates from Blömeke Fig. 7. The ion-level figures are schematics you can manipulate |
| Tone | Sceptical, informed reader. No hype or emojis. Methods section in the passive voice ("How this was counted"). Every number is tappable to its source |
| Sharing | All state in URL parameters (evorpetrol's `share.ts` pattern), including the reader's guess. No backend |
| Stack | Fork of the evorpetrol setup: Vite, React, TypeScript, Motion, three.js via React Three Fiber and drei, Vitest, oxlint. **One shared WebGL canvas** (drei `View`), and figures render only when on screen |
| Hosting | **Public** GitHub repo on GitHub Pages. A GitHub Action runs the tests, builds and deploys, and failing tests block the deploy. CSP in a `<meta>` tag (Pages can't set headers). Domain decided later |
| Analytics | GoatCounter (cookie-free, no consent banner) |
| Colours | `#285943`, `#acb876`, `#9bc53d`, `#7cb4b8`, `#4e4187` plus off-white and near-black. One colour per concept across the whole page; coloured words in the prose match the figures |

## Sources

| Source | Use |
|---|---|
| Blömeke et al. 2022, *J. Clean. Prod.* 377, 134344 | Core calculator: 3 routes, 1 t of spent NMC622 pouch packs, Germany 2021. Net avoided ≈ 5–7 t CO₂e per t of battery. Table 2 pack bill of materials; Fig. 7 recovery rates |
| Hanna et al. 2025, *ES&T* 59, 14432 | Regional factors (NA / Europe incl. UK / China). Truncated hydro as a cross-check |
| Wesselkämper et al. 2025, *ES&T* 59, 15751 | Second life vs recycling (own model results only) |
| Ember, Yearly Electricity Data (2025 release), CC BY 4.0 | Grid intensities for the region swap |
| Dittmer et al. 2026, *Waste Management* | Hydromet cross-check (3.5 kg CO₂e/kg of black mass) |
| Perocillo et al. 2025, *Int J LCA* 30 | Hydro/pyro cross-check (0.9 kg CO₂e/kg of battery) |
| Harper et al. 2019, *Nature* 575 | Qualitative process background |
| DBT/Frazer-Nash 2025; Faraday Insights 20 (2024) | Grey: UK only makes black mass and exports it for hydromet, mostly to Asia |
| Waste Batteries and Accumulators Regulations 2009, reg. 56 (E, W, NI); Waste Batteries (Scotland) Regs 2009 | The hook: EV packs ("industrial" batteries) may not be landfilled or incinerated. Scotland's 2025 amendment unchecked |

Sanity check for a 60 kWh default pack (≈ 0.36 t): net ≈ −1.8 to −2.5 t CO₂e.

## Open

- Any further source is approved by Rohin before it's added.
- Domain name.

## Phases

Each phase ends with a check-in: demo it, agree, then move on. Nothing is published until Phase 8.

### Phase 0: Scaffold
- New public repo. Copy evorpetrol's Vite, TypeScript, Vitest and oxlint config. (`share.ts` pattern arrives in Phase 3, data-file shape in Phase 1.)
- GitHub Action: lint → test → build → check CSP → deploy to Pages. CSP injected as a meta tag at build time only (it would block Vite's dev server). GoatCounter waits for Phase 8, once the domain is chosen, so it doesn't mix with evorpetrol's stats.
- **Done when:** a blank page deploys from `main`, and a failing test blocks the deploy.

### Phase 1: Data
- Fetch the supplementary files: Blömeke SM (incl. SM.7), Hanna SI-1/SI-2, Wesselkämper S1–S7.
- Data file: every parameter as `{ central, unit, source, note, chartRead? }`.
- Ember grid intensities; WBAR 2009 reg. 56 for the hook.
- **Done when:** every calculator input has a sourced value, and chart-read values are flagged.

### Phase 2: Calculation engine (no UI)
- Pure functions: `process(pack, route, region)`, `credit(pack, route, substitution)`, `net(...)`, `recovered(pack, route)` (mass by material, for the guess reveal).
- **Done when:** tests reproduce Blömeke's net per tonne for each route and Hanna's regional deltas within rounding.

### Phase 3: Calculator chapter (first slice)
- Inputs: pack kWh, route, hydromet region, substitution (advanced). Process, credit and net bars. Recovered-mass reveal against the reader's guess.
- Share link restores every input and the guess.
- **Done when:** changing any input updates the numbers to match the engine, and a copied link reproduces the state in a fresh browser.

### Phase 4: Figure system
- Shared canvas with a `View` per figure; render only on screen; lighting and materials (soft and clean, not photoreal).
- Layout pattern: text with its figure alongside on desktop, and the figure pinned above the text on a phone.
- Colour and shape conventions fixed.
- **Done when:** 3 placeholder figures on one page scroll smoothly on a mid-range phone.

### Phase 5: Process chapters
One slice per chapter, each with an interactive figure that adds a single concept:
1. Waste hierarchy and second life.
2. Discharge and disassembly.
3. Pretreatment routes: pyro, mechanical, thermal-mechanical (scrub through each).
4. Hydrometallurgy at ion level: leaching, solvent extraction, precipitation. Why it works.
5. Recovered salts and ions, with the recovery rate for each route.
- **Done when:** each chapter reads well on its own, and the whole page holds frame rate on a phone.

### Phase 6: Hook, reveal and method
- Opening hook and guess slider; reveal after the calculator.
- Tap-to-source cards on every number.
- "How this was counted" (passive voice): system model, scaling, substitution, region, shortcuts taken, what's left out.
- **Done when:** every number on screen has a source card.

### Phase 7: Polish
- Copy pass, glossary pop-overs, contrast and keyboard access, `og:image` for link previews, performance pass.
- **Done when:** checked on phone and desktop, in light and dark.

### Phase 8: Test and launch
- 10–20 testers answer three pre/post questions (route, why hydromet works, net impact). Target: 80% correct.
- Fix any gaps, choose the domain, publish, share. GoatCounter tracks the 5% share target.

## Milestone 2 (per the PRD)
- LFP in the calculator and simulations.
- How a cell is made, and how it fits into a module and a pack.
- Charging, discharging, and why Li-ion cells lose capacity.
