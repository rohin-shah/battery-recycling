/** Every source the page cites, in the order they are listed at the end. `short` is how it appears in the text. */
export const SOURCES = {
  argonne2020: {
    short: 'Argonne 2020',
    full: 'Argonne National Laboratory (2020), Battery Second Life: Frequently Asked Questions.',
    url: 'https://afdc.energy.gov/files/u/publication/battery_second_life_faq.pdf',
  },
  birkl2017: {
    short: 'Birkl 2017',
    full: 'Birkl, Roberts, McTurk, Bruce & Howey (2017), Degradation diagnostics for lithium ion cells, Journal of Power Sources 341, 373–386.',
    url: 'https://doi.org/10.1016/j.jpowsour.2016.12.011',
  },
  blomeke2022: {
    short: 'Blömeke 2022',
    full: 'Blömeke et al. (2022), Material and energy flow analysis for environmental and economic impact assessment of industrial recycling routes for lithium-ion traction batteries, Journal of Cleaner Production 377, 134344.',
    url: 'https://doi.org/10.1016/j.jclepro.2022.134344',
  },
  chen2018: {
    short: 'Chen 2018',
    full: 'Chen & Ho (2018), Recovery of Valuable Metals from Lithium-Ion Batteries NMC Cathode Waste Materials by Hydrometallurgical Methods, Metals 8(5), 321.',
    url: 'https://doi.org/10.3390/met8050321',
  },
  chernyaev2021: {
    short: 'Chernyaev 2021',
    full: 'Chernyaev, Wilson & Lundström (2021), Study on valuable metal incorporation in the Fe–Al precipitate during neutralization of LIB leach solution, Scientific Reports 11, 23283.',
    url: 'https://doi.org/10.1038/s41598-021-02019-2',
  },
  chernyaev2023: {
    short: 'Chernyaev 2023',
    full: 'Chernyaev et al. (2023), Fe³⁺ and Al³⁺ removal by phosphate and hydroxide precipitation from synthetic NMC Li-ion battery leach solution, Scientific Reports.',
    url: 'https://doi.org/10.1038/s41598-023-48247-6',
  },
  dai2019: {
    short: 'Dai 2019',
    full: 'Dai, Spangenberger, Ahmed, Gaines, Kelly & Wang (2019), EverBatt: A Closed-loop Battery Recycling Cost and Environmental Impacts Model, Argonne National Laboratory, ANL-19/16.',
    url: 'https://doi.org/10.2172/1530874',
  },
  dittmer2026: { short: 'Dittmer 2026', full: 'Dittmer et al. (2026), Waste Management 211, 115283.', url: undefined },
  eu2023: {
    short: 'EU 2023/1542',
    full: 'Regulation (EU) 2023/1542 concerning batteries and waste batteries, OJ L 191, 28.7.2023.',
    url: 'https://eur-lex.europa.eu/eli/reg/2023/1542/oj',
  },
  harper2019: {
    short: 'Harper 2019',
    full: 'Harper, Sommerville, Kendrick et al. (2019), Recycling lithium-ion batteries from electric vehicles, Nature 575, 75–86.',
    url: 'https://doi.org/10.1038/s41586-019-1682-5',
  },
  lacap2022: {
    short: 'Lacap 2022',
    full: 'Lacap, Rahman & Park (2022), Demonstration of Community-Scale Low-Cost Highly Efficient Photovoltaic and Energy Management System, California Energy Commission, CEC-500-2022-006.',
    url: 'https://www.energy.ca.gov/sites/default/files/2022-09/CEC-500-2022-006.pdf',
  },
  lee2025: {
    short: 'Lee 2025',
    full: 'Lee, Seo, Chang et al. (2025), Application of Two-Compartment Bipolar Membrane Electrodialysis for Treatment of Waste Na₂SO₄ Solution, Membranes 15(10), 312.',
    url: 'https://doi.org/10.3390/membranes15100312',
  },
  martell1976: {
    short: 'Martell & Smith 1976',
    full: 'Martell & Smith (1976), Critical Stability Constants, Volume 4: Inorganic Complexes, Plenum Press.',
    url: undefined,
  },
  minviro2026: {
    short: 'Minviro 2025',
    full: 'Lase, Myers, Shah & Alacacayir (2025), Climate Change Impact of Recycled vs Virgin Metals for Lithium-ion Batteries, Minviro white paper.',
    url: 'https://minviro.com/download/recycled-vs-virgin-metals-whitepaper',
  },
  nrel2015: {
    short: 'NREL 2015',
    full: 'Neubauer, Smith, Wood & Pesaran (2015), Identifying and Overcoming Critical Barriers to Widespread Second Use of PEV Batteries, NREL/TP-5400-63332.',
    url: 'https://www.osti.gov/biblio/1171780',
  },
  rey2021: {
    short: 'Rey 2021',
    full: 'Rey, Vallejo, Santiago, Iturrondobeitia & Lizundia (2021), Environmental Impacts of Graphite Recycling from Spent Lithium-Ion Batteries Based on Life Cycle Assessment, ACS Sustainable Chemistry & Engineering 9, 14488–14501.',
    url: 'https://doi.org/10.1021/acssuschemeng.1c04938',
  },
  uk2009: {
    short: 'UK 2009',
    full: 'The Waste Batteries and Accumulators Regulations 2009 (SI 2009/890).',
    url: 'https://www.legislation.gov.uk/uksi/2009/890',
  },
  wesselkamper2025: {
    short: 'Wesselkämper 2025',
    full: 'Wesselkämper, Hendrickson, Lux & von Delft (2025), Recycling or Second Use? Supply Potentials and Climate Effects of End-of-Life Electric Vehicle Batteries, Environmental Science & Technology 59, 15751–15765.',
    url: 'https://doi.org/10.1021/acs.est.5c01823',
  },
} as const satisfies Record<string, { short: string; full: string; url: string | undefined }>

export type SourceId = keyof typeof SOURCES
