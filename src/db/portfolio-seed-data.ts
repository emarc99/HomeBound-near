export interface PortfolioStageDef {
  seq: number;
  name: string;
  description: string;
  days: number;
  laborUsd: number;
  criteria: string;
  fundTx: string;
  releaseTx: string;
}

export interface PortfolioSpecs {
  architect: string;
  structuralEngineer: string;
  facadeMaterial: string;
  roofSystem: string;
  energySystem: string;
  climateStrategy: string;
  elevationDatum: string;
  plates: {
    heroCaption: string;
    sectionCaption: string;
    detailCaption: string;
  };
}

export interface CompletedProjectDef {
  slug: string;
  code: string;
  name: string;
  typology: string;
  completionStatus: "completed" | "in_progress";
  completedYear: number;
  areaSqm: number;
  durationWeeks: number;
  ownerName: string;
  ownerCity: string;
  ownerCountry: string;
  ownerNearAccount: string;
  siteCity: string;
  siteState: string;
  siteLat: number;
  siteLng: number;
  siteRadiusM: number;
  ngnPerUsd: number;
  startDateIso: string;
  nearProjectId: string;
  contractorName: string;
  contractorNearAccount: string;
  foremanName: string;
  layoutVariant: "monograph" | "diptych" | "arca-grid" | "atelier" | "live-escrow";
  heroImage: string;
  sectionImage: string;
  detailImage: string;
  summary: string;
  architecturalBrief: string;
  spatialNotes: string;
  structuralNotes: string;
  specs: PortfolioSpecs;
  stages: PortfolioStageDef[];
}

export const HERO_PORTFOLIO_META = {
  slug: "akobo-bungalow-ibadan",
  code: "HB-05",
  typology: "Residential · 3-Bedroom Bungalow",
  completionStatus: "in_progress" as const,
  completedYear: 2026,
  areaSqm: 210,
  durationWeeks: 19,
  layoutVariant: "live-escrow" as const,
  heroImage: "/art/hero-tee-scan-morph.png",
  sectionImage: "/art/stages-exploded-axonometric.png",
  detailImage: "/art/cta-stipple-pavilion.png",
  summary:
    "Live Testnet flagship in Akobo, Ibadan commissioned from London. Six milestone tranches locked on NEAR escrow, with Stages 01–02 released and Stage 03 blockwork actively under gasless foreman verification.",
  architecturalBrief:
    "Commissioned by a London-based family building a permanent single-storey residence on a dry laterite corner plot in Akobo, Ibadan. Every structural stage was decomposed into hash-locked criteria stored in Rust on NEAR so inspections happen from site photography rather than personal favours.",
  spatialNotes:
    "Organised along an east-west ridge to minimise afternoon solar heat gain on bedrooms while pulling prevailing south-westerly breezes through a recessed front veranda and deep eave overhangs.",
  structuralNotes:
    "Strip footing in M20 reinforced concrete seated 900 mm below natural ground level, damp-proof membrane under 150 mm oversite slab, 9-inch load-bearing sandcrete perimeter blockwork bound by a continuous cast-in-situ lintel beam.",
  specs: {
    architect: "Studio Akobo / HomeBound Field CAD",
    structuralEngineer: "Oyo Civil & Foundation Partners",
    facadeMaterial: "9-inch vibrated sandcrete + mineral limewash",
    roofSystem: "Seasoned iroko & hard-pine trusses, 0.55 mm longspan sheet",
    energySystem: "5 kVA hybrid solar array + dual changeover distribution",
    climateStrategy: "650 mm eave overhangs + cross-ventilated clerestory",
    elevationDatum: "+0.45 m Plinth · +3.45 m Eave · +5.15 m Ridge",
    plates: {
      heroCaption: "FIG 05.A · Stage 03 masonry reality-to-CAD perimeter contour scan",
      sectionCaption: "FIG 05.B · Exploded 3-tier axonometric structural stage breakdown",
      detailCaption: "FIG 05.C · Completed envelope target perspective in Bayer stipple",
    },
  } satisfies PortfolioSpecs,
};

export const COMPLETED_PORTFOLIO_PROJECTS: CompletedProjectDef[] = [
  {
    slug: "casa-alagbaka-akure",
    code: "HB-01",
    name: "Casa Alagbaka Courtyard Residence",
    typology: "Courtyard Residence · 4-Bedroom",
    completionStatus: "completed",
    completedYear: 2025,
    areaSqm: 285,
    durationWeeks: 22,
    ownerName: "Dr. Folake Adebayo",
    ownerCity: "Manchester",
    ownerCountry: "GB",
    ownerNearAccount: "adebayo-uk.testnet",
    siteCity: "Akure",
    siteState: "Ondo",
    siteLat: 7.2571,
    siteLng: 5.2058,
    siteRadiusM: 180,
    ngnPerUsd: 1550,
    startDateIso: "2025-02-10T09:00:00.000Z",
    nearProjectId: "hb-alagbaka-courtyard-01",
    contractorName: "Ondo Heritage Civil & Masonry",
    contractorNearAccount: "heritage-civil.testnet",
    foremanName: "Engr. Kayode Mimiko (site foreman)",
    layoutVariant: "monograph",
    heroImage: "/projects/alagbaka-hero.png",
    sectionImage: "/projects/alagbaka-section.png",
    detailImage: "/projects/alagbaka-detail.png",
    summary:
      "Four-bedroom limestone and terracotta courtyard villa built around a shallow cooling impluvium in Alagbaka GRA, Akure. Six milestone tranches settled across 22 weeks for Manchester-based homeowner Dr. Folake Adebayo.",
    architecturalBrief:
      "Like Hart Oliveira's walled courtyard houses, Casa Alagbaka turns inward away from street dust and glare toward a quiet landscaped basin. The brief called for zero middleman procurement delays: materials and crew draws were released stage-by-stage only as geotagged masonry photos matched structural datum elevations.",
    spatialNotes:
      "A 24.2-metre colonnaded gallery mediates between the shaded central impluvium pool and the four sleeping quarters. Perforated laterite breeze-blocks filter low morning light into geometric shadows across honed terrazzo floors.",
    structuralNotes:
      "Reinforced laterite strip-and-beam plinth elevated +600 mm above seasonal runoff, paired with a continuous steel-reinforced ring beam supporting 1.4-metre deep concrete sun-shading cantilevers.",
    specs: {
      architect: "Olaoluwa & Hart Practice (Lagos / Porto)",
      structuralEngineer: "Ondo GeoStruct Associates",
      facadeMaterial: "Lime-washed sandcrete + extruded perforated terracotta screen",
      roofSystem: "Flat concrete heat-sink deck with waterproof screed & stone ballast",
      energySystem: "10 kVA lithium solar array + subterranean rainwater cistern",
      climateStrategy: "62° equatorial solstice shading + impluvium evaporative cooling",
      elevationDatum: "+0.60 m Plinth · +3.65 m Clear Colonnade · +4.25 m Parapet",
      plates: {
        heroCaption: "FIG 01.A · Courtyard perspective looking across impluvium basin and colonnade",
        sectionCaption: "FIG 01.B · Longitudinal Section A-A & Ground Floor Courtyard Plan (1:100)",
        detailCaption: "FIG 01.C · Interior colonnade & perforated laterite daylight screen",
      },
    },
    stages: [
      {
        seq: 1,
        name: "Site survey & laterite perimeter walling",
        description: "Surveyor beacons pinned, laterite topsoil cleared, and security perimeter blockwork erected.",
        days: 14,
        laborUsd: 1800,
        criteria: "Boundary pegs verified inside 180 m Akure geofence; perimeter walling plumbed to +2.10 m datum.",
        fundTx: "5H9kMnP2xQr8vT4bW7yC1zL6dF3nJ8sA2eR5tY9uK4mQp",
        releaseTx: "8QpL3zV7mC2xR9nW4bT6yF1kJ5hD8sA3eM7uN2pX6vGrT",
      },
      {
        seq: 2,
        name: "Strip plinth & impluvium basin tanking",
        description: "Reinforced strip trenches cast with waterproof crystalline additive and recessed impluvium basin shell.",
        days: 24,
        laborUsd: 3400,
        criteria: "B16 rebar cages, damp-proof membrane laps, and hydro-tested reflecting pool shell.",
        fundTx: "2VxR8pL4mN9cQ1wK7bT3yF6jH5dA8sE2uZ9gM4nP7xQrW",
        releaseTx: "6KmT9wP3xL2vN8cQ5bR1yF4jH7dA6sE3uZ8gM2nP9xQpY",
      },
      {
        seq: 3,
        name: "Colonnade columns & masonry walls",
        description: "Six monolithic colonnade piers cast and cured; 9-inch perimeter walls laid to full soffit height.",
        days: 35,
        laborUsd: 4200,
        criteria: "Vertical laser plumb within 4 mm across 6 piers; mortar beds clean to +3.65 m soffit line.",
        fundTx: "9NpR4vL7mX2cQ8wK3bT5yF1jH6dA9sE4uZ2gM7nP3xQrK",
        releaseTx: "3RtY7wL2mN5cQ9xK4bT8yF2jH1dA7sE5uZ3gM8nP4xQpM",
      },
      {
        seq: 4,
        name: "Cantilever roof deck & ring beam",
        description: "Post-tensioned overhang beam and solid roof deck poured with solar conduit sleeves and scupper outlets.",
        days: 32,
        laborUsd: 4100,
        criteria: "1,400 mm eave cantilever true without deflection; screed slope 1:60 toward storm chutes.",
        fundTx: "4LmK8vP3nX5cQ2wR9bT7yF4jH8dA2sE6uZ1gM5nP8xQrN",
        releaseTx: "7YwT2mL6xN4cQ3wK8bR5yF9jH3dA1sE7uZ4gM6nP2xQpB",
      },
      {
        seq: 5,
        name: "Perforated terracotta screen & MEP",
        description: "Extruded laterite brise-soleil screen installed along east wing; concealed pressure plumbing and solar wiring.",
        days: 25,
        laborUsd: 2600,
        criteria: "3.5 bar cold-water manifold hold 24h; mortar joints flush on terracotta screen grid.",
        fundTx: "1ZxV5mP9nX3cQ7wK2bT4yF8jH9dA5sE1uZ6gM3nP7xQrC",
        releaseTx: "5BcN8wL4mX7cQ2vK9bT3yF6jH2dA8sE4uZ7gM1nP5xQpD",
      },
      {
        seq: 6,
        name: "Honed terrazzo, teak doors & handover",
        description: "Hand-seeded terrazzo courtyard floor polished, solid iroko doors hung, and keys transferred to family representative.",
        days: 24,
        laborUsd: 2300,
        criteria: "Walkthrough punchlist 0 open defects; solar inverter commissioning log attached.",
        fundTx: "8DfG3vL9mN2cQ6wK4bT7yF1jH5dA9sE3uZ2gM8nP6xQrF",
        releaseTx: "2GhJ6wP1mX8cQ4vK5bT9yF3jH7dA2sE8uZ5gM9nP3xQpL",
      },
    ],
  },
  {
    slug: "villa-independence-enugu",
    code: "HB-02",
    name: "Villa Udoka Terraced Duplex",
    typology: "Hillside Duplex · 5-Bedroom",
    completionStatus: "completed",
    completedYear: 2025,
    areaSqm: 360,
    durationWeeks: 28,
    ownerName: "Chukwuma & Ngozi Okafor",
    ownerCity: "Toronto",
    ownerCountry: "CA",
    ownerNearAccount: "okafor-toronto.testnet",
    siteCity: "Enugu",
    siteState: "Enugu",
    siteLat: 6.4413,
    siteLng: 7.5198,
    siteRadiusM: 200,
    ngnPerUsd: 1550,
    startDateIso: "2025-01-18T09:00:00.000Z",
    nearProjectId: "hb-udoka-escarpment-02",
    contractorName: "Eastern Crest Structural Ltd",
    contractorNearAccount: "eastern-crest.testnet",
    foremanName: "Uche Nnamani (site foreman)",
    layoutVariant: "diptych",
    heroImage: "/projects/enugu-hero.png",
    sectionImage: "/projects/enugu-section.png",
    detailImage: "/projects/enugu-detail.png",
    summary:
      "A stepped 360 sqm concrete-and-teak hillside duplex anchored into a 4.2-metre slope in Independence Layout, Enugu. Delivered over 28 weeks with $24,000 USDC settled across 6 attested milestones from Toronto.",
    architecturalBrief:
      "Steep escarpment plots in Enugu typically trigger opaque retaining-wall cost overruns for diaspora owners. Following a Moss Keld orthographic rigor, every earth-retaining lift, column pour, and cantilevered bedroom deck was tied to verifiable section elevations before funds unlocked.",
    spatialNotes:
      "The lower street level houses a double-height reception atrium and guest pavilion tucked behind stone-faced retaining walls, while the upper sleeping volume cantilevers 4.4 metres west to capture cooling valley winds over the Udi ridge.",
    structuralNotes:
      "Deep-bored concrete retaining piles at +4.20 m grade change, coupled with a suspended first-floor waffle deck and full-height board-formed shear wall spine.",
    specs: {
      architect: "Nnamdi & Keld Tectonic Studio",
      structuralEngineer: "Enugu Escarpment Engineering",
      facadeMaterial: "Board-formed architectural concrete + oiled Nigerian teak fins",
      roofSystem: "Insulated concrete cantilever deck with concealed valley gutters",
      energySystem: "12 kVA split-phase solar + deep borehole treatment",
      climateStrategy: "4.4 m cantilevered shade soffit + stack-effect atrium skylight",
      elevationDatum: "-3.10 m Lower Terrace · +0.00 m Deck · +3.40 m Upper · +6.80 m Roof",
      plates: {
        heroCaption: "FIG 02.A · West escarpment elevation showing cantilevered teak louver volume",
        sectionCaption: "FIG 02.B · Topographic Cross-Section B-B & Cantilever Moment Diagram (1:75)",
        detailCaption: "FIG 02.C · Double-height concrete atrium & folded teak staircase study",
      },
    },
    stages: [
      {
        seq: 1,
        name: "Slope benching & geo-pile drilling",
        description: "Stepped excavation across +4.20 m escarpment slope and 14 augered concrete retaining piles.",
        days: 28,
        laborUsd: 3500,
        criteria: "Pile refusal logs attested; temporary shoring drainage channels open.",
        fundTx: "7KlM4vP2nX8cQ5wR1bT9yF3jH6dA4sE8uZ2gM7nP5xQrG",
        releaseTx: "4MnP9wL3mX6cQ2vK7bT5yF1jH8dA3sE6uZ9gM4nP2xQpH",
      },
      {
        seq: 2,
        name: "Laterite retaining plinth & ground slab",
        description: "Reinforced retaining wall stem cast with French drain weep holes and lower ground oversite slab.",
        days: 35,
        laborUsd: 4800,
        criteria: "Waterproofing membrane continuous behind stem; 28-day cylinder test >25 MPa.",
        fundTx: "9PqR2vL6mX3cQ8wK4bT1yF7jH5dA2sE9uZ4gM6nP3xQrJ",
        releaseTx: "1RsT5wP8mX4cQ1vK6bT3yF9jH2dA7sE5uZ1gM8nP4xQpK",
      },
      {
        seq: 3,
        name: "Lower ground columns & atrium core",
        description: "Board-formed shear walls and structural columns poured to support cantilevered upper living deck.",
        days: 38,
        laborUsd: 4600,
        criteria: "Clean pine formwork impressions; staircase soffit steel tied per structural sheet.",
        fundTx: "6TuV8vL3mX9cQ4wK2bT7yF5jH1dA8sE3uZ6gM2nP9xQrM",
        releaseTx: "3VwX1wP6mX5cQ9vK3bT8yF4jH6dA2sE7uZ3gM5nP8xQpN",
      },
      {
        seq: 4,
        name: "4.4 m cantilevered deck & upper masonry",
        description: "High-density rebar cantilever slab cast and upper bedroom volume enclosed with blockwork.",
        days: 42,
        laborUsd: 5200,
        criteria: "Propping retained 21 days; zero soffit deflection after backpropping strike.",
        fundTx: "8XyZ4vL7mX2cQ6wK9bT4yF2jH8dA5sE1uZ7gM3nP6xQrP",
        releaseTx: "5ZaB7wP3mX9cQ5vK1bT6yF8jH4dA9sE2uZ5gM1nP7xQpQ",
      },
      {
        seq: 5,
        name: "Teak louver screen & skylight glazing",
        description: "Kiln-dried teak vertical sun fins anchored to steel brackets; triple-sealed skylight installed.",
        days: 28,
        laborUsd: 3100,
        criteria: "Hose-test skylight perimeter leak-free; marine oil finish on exterior teak fins.",
        fundTx: "2CdE9vL4mX6cQ1wK5bT8yF3jH9dA6sE4uZ8gM2nP5xQrR",
        releaseTx: "7EfG2wP8mX3cQ7vK4bT2yF6jH1dA8sE9uZ2gM6nP4xQpS",
      },
      {
        seq: 6,
        name: "Folded stair joinery & final handover",
        description: "Teak treads fitted over folded steel stair carriage, kitchen cabinetry installed, keys signed over.",
        days: 25,
        laborUsd: 2800,
        criteria: "All 6 escrow tranches reconciled; Toronto owners signed final handover protocol.",
        fundTx: "4HiJ5vL1mX8cQ3wK7bT5yF9jH2dA4sE6uZ1gM9nP3xQrT",
        releaseTx: "9JkL8wP4mX2cQ6vK8bT1yF5jH7dA3sE4uZ8gM7nP1xQpU",
      },
    ],
  },
  {
    slug: "iyaganku-pavilion-ibadan",
    code: "HB-03",
    name: "Iyaganku GRA Cantilever Pavilion",
    typology: "Garden Pavilion · 3-Bedroom",
    completionStatus: "completed",
    completedYear: 2025,
    areaSqm: 240,
    durationWeeks: 20,
    ownerName: "Damilola Ogunleye",
    ownerCity: "Dublin",
    ownerCountry: "IE",
    ownerNearAccount: "ogunleye-ie.testnet",
    siteCity: "Ibadan",
    siteState: "Oyo",
    siteLat: 7.3775,
    siteLng: 3.8795,
    siteRadiusM: 150,
    ngnPerUsd: 1550,
    startDateIso: "2025-04-03T09:00:00.000Z",
    nearProjectId: "hb-iyaganku-pavilion-03",
    contractorName: "Adewale Builders Ltd",
    contractorNearAccount: "adewale-build.testnet",
    foremanName: "Segun Babalola (site foreman)",
    layoutVariant: "arca-grid",
    heroImage: "/projects/iyaganku-hero.png",
    sectionImage: "/projects/iyaganku-section.png",
    detailImage: "/projects/iyaganku-detail.png",
    summary:
      "Horizontal steel-and-sandcrete pavilion set under mature Iyaganku rain trees, featuring a 4.2-metre knife-edge roof canopy. Built for Dublin-based product designer Damilola Ogunleye across $14,500 USDC in 20 weeks.",
    architecturalBrief:
      "Designed in the minimalist spirit of ARCA's spatial pavilion studies: zero ornamental mouldings, pure horizontal planes, and calibrated steel portal frames bolted to a warm sandcrete central service core.",
    spatialNotes:
      "A single travertine plinth elevates the entire 240 sqm footprint 450 mm above wet-season garden soil. Sliding floor-to-ceiling black aluminum doors collapse the boundary between indoor study and shaded veranda.",
    structuralNotes:
      "Galvanized IPE-240 structural steel portal beams bolted onto anchor plates cast into reinforced masonry core piers, topped by insulated standing-seam aluminum roof panels.",
    specs: {
      architect: "Damilola & Arca Spatial Collaboratory",
      structuralEngineer: "WestSteel Nigeria Ltd",
      facadeMaterial: "Natural cement plaster core + black powder-coated steel glazing",
      roofSystem: "IPE-240 cantilever portal + acoustic insulated flat fascia",
      energySystem: "8 kVA inverter + low-consumption VRV split cooling",
      climateStrategy: "Under-tree canopy siting + 360° cross ventilation",
      elevationDatum: "+0.45 m Plinth · +3.45 m Canopy Soffit · +3.82 m Fascia",
      plates: {
        heroCaption: "FIG 03.A · Elevation showing 4.2m knife-edge roof cantilever on travertine plinth",
        sectionCaption: "FIG 03.B · Inverted Axonometric Steel Truss & Lintel Portal Blueprint (1:50)",
        detailCaption: "FIG 03.C · Galvanized column-to-fascia gusset plate & bolt node (1:10)",
      },
    },
    stages: [
      {
        seq: 1,
        name: "Tree-protection setting out & grading",
        description: "Root-zone buffers staked around mature rain trees; level bench established for floating plinth.",
        days: 10,
        laborUsd: 1200,
        criteria: "Canopy trees undisturbed; elevation benchmarks verified across all 4 plinth corners.",
        fundTx: "5LmN3vP7mX2cQ8wK4bT6yF1jH9dA3sE7uZ2gM5nP8xQrV",
        releaseTx: "2NoP6wL1mX5cQ4vK9bT3yF7jH2dA8sE4uZ6gM1nP3xQpW",
      },
      {
        seq: 2,
        name: "Reinforced travertine plinth & hold-down bolts",
        description: "Elevated raft slab poured with precision cast-in steel baseplate anchors for portal columns.",
        days: 24,
        laborUsd: 2600,
        criteria: "Anchor bolt grid within 2 mm tolerance by laser level; plinth edges sharp.",
        fundTx: "8PqS9vL4mX7cQ2wK6bT1yF5jH3dA9sE2uZ7gM4nP6xQrX",
        releaseTx: "4QrT2wP7mX1cQ5vK3bT8yF4jH6dA2sE9uZ1gM7nP5xQpY",
      },
      {
        seq: 3,
        name: "Central masonry core & wet walls",
        description: "Bathrooms, kitchen utility spine, and shear blockwork core erected to portal bearing height.",
        days: 28,
        laborUsd: 2900,
        criteria: "Mortar strength test passed; chased conduits cleanly embedded.",
        fundTx: "1StU5vL8mX3cQ7wK2bT4yF9jH1dA6sE5uZ3gM8nP2xQrZ",
        releaseTx: "6UvW3wP9mX4cQ1vK7bT2yF6jH8dA4sE1uZ5gM3nP9xQpA",
      },
      {
        seq: 4,
        name: "Steel portal frame & 4.2m cantilever",
        description: "Prefabricated IPE-240 steel beams craned onto hold-down bolts and welded to full cantilever.",
        days: 26,
        laborUsd: 3400,
        criteria: "Weld dye-penetrant inspection passed; torque specs verified on all flange bolts.",
        fundTx: "3WxY7vL2mX9cQ5wK8bT1yF4jH7dA3sE6uZ9gM5nP1xQrB",
        releaseTx: "9YzA4wP6mX2cQ8vK5bT7yF1jH3dA9sE2uZ4gM6nP8xQpC",
      },
      {
        seq: 5,
        name: "Acoustic ceiling soffit & glazing bays",
        description: "Cedar strip soffit installed under cantilever; black anodized aluminum sliding walls glazed.",
        days: 28,
        laborUsd: 2500,
        criteria: "Track drainage clear; double-glazed acoustic seals flush along threshold.",
        fundTx: "7AbC1vL5mX4cQ9wK3bT6yF8jH2dA7sE4uZ1gM9nP5xQrD",
        releaseTx: "5CdE8wP2mX6cQ3vK1bT4yF9jH5dA1sE8uZ7gM2nP4xQpE",
      },
      {
        seq: 6,
        name: "Exterior screed, lighting & handover",
        description: "Travertine tiles laid on plinth deck, architectural wash lighting tested, keys released in Ibadan.",
        days: 24,
        laborUsd: 1900,
        criteria: "Full solar + lighting load test complete; Dublin client signed release.",
        fundTx: "2EfG6vL9mX1cQ4wK7bT3yF2jH8dA5sE9uZ3gM4nP7xQrF",
        releaseTx: "8GhI3wP5mX7cQ2vK6bT9yF4jH1dA6sE3uZ8gM5nP2xQpG",
      },
    ],
  },
  {
    slug: "chevron-annex-lekki",
    code: "HB-04",
    name: "Chevron Drive Courtyard Annex",
    typology: "Coastal Studio & Annex · 2-Unit",
    completionStatus: "completed",
    completedYear: 2026,
    areaSqm: 195,
    durationWeeks: 16,
    ownerName: "Kemi & Babajide Bello",
    ownerCity: "Houston",
    ownerCountry: "US",
    ownerNearAccount: "bello-houston.testnet",
    siteCity: "Lekki",
    siteState: "Lagos",
    siteLat: 6.4426,
    siteLng: 3.5392,
    siteRadiusM: 140,
    ngnPerUsd: 1550,
    startDateIso: "2025-10-08T09:00:00.000Z",
    nearProjectId: "hb-chevron-annex-04",
    contractorName: "Lagoon Pile & Formwork Co.",
    contractorNearAccount: "lagoon-pile.testnet",
    foremanName: "Tosin Balogun (site foreman)",
    layoutVariant: "atelier",
    heroImage: "/projects/lekki-hero.png",
    sectionImage: "/projects/lekki-section.png",
    detailImage: "/projects/lekki-detail.png",
    summary:
      "Flood-resilient twin coastal studio wings joined by a breezy glazed courtyard gallery off Chevron Drive, Lekki. Erected in 16 weeks over a +1.20 m cellular raft for Houston owners Kemi & Babajide Bello ($11,200 USDC).",
    architecturalBrief:
      "Lekki's high water table demands disciplined foundation engineering before a single wall goes up. HomeBound locked pile depths, raft freeboard heights, and coastal brise-soleil masonry directly into the escrow criteria hashes.",
    spatialNotes:
      "Two mirror-symmetric whitewashed wings frame a central ventilated courtyard deck, allowing cross-breezes from the Atlantic lagoon to flush humidity without constant mechanical cooling.",
    structuralNotes:
      "Driven friction piles anchored below coastal sand fill supporting a 700 mm cellular concrete raft raising finished floor level +1,200 mm above street crown.",
    specs: {
      architect: "Studio Lagoon & Bell",
      structuralEngineer: "Island Pile Civil Works",
      facadeMaterial: "Salt-resistant elastomeric whitewash + vertical terracotta brise-soleil",
      roofSystem: "Flat concrete parapet slab with marine-grade membrane",
      energySystem: "7.5 kVA hybrid solar + borehole RO filtration",
      climateStrategy: "+1.20 m flood-resilient freeboard + deep louver solar fins",
      elevationDatum: "+0.00 m Street Crown · +1.20 m Raft Top · +4.45 m Parapet",
      plates: {
        heroCaption: "FIG 04.A · South coastal elevation showing twin wings on +1.20m raft plinth",
        sectionCaption: "FIG 04.B · Pile-Cap & Cellular Raft Section + Twin Wing Plan (1:100)",
        detailCaption: "FIG 04.C · Vertical extruded terracotta brise-soleil solar fin detail",
      },
    },
    stages: [
      {
        seq: 1,
        name: "Sand-fill compaction & dewatering",
        description: "Plate load verification on compacted sharp-sand fill and temporary wellpoint dewatering.",
        days: 12,
        laborUsd: 1300,
        criteria: "Water table lowered -1.4 m for clean blinding; compaction test >95% MDD.",
        fundTx: "6IjK2vL8mX5cQ1wK9bT4yF7jH3dA8sE2uZ5gM3nP6xQrH",
        releaseTx: "3KlM7wP4mX2cQ6vK1bT8yF3jH9dA4sE7uZ2gM8nP1xQpJ",
      },
      {
        seq: 2,
        name: "Friction piles & +1.20m cellular raft",
        description: "Concrete friction piles driven and tied into 700 mm stiffened cellular raft beam grid.",
        days: 26,
        laborUsd: 2900,
        criteria: "Finished raft top confirmed +1,200 mm above street crown datum.",
        fundTx: "9MnO4vL1mX7cQ3wK6bT2yF8jH4dA9sE5uZ1gM6nP3xQrK",
        releaseTx: "5NoP1wP8mX4cQ9vK2bT7yF5jH1dA6sE3uZ8gM4nP7xQpL",
      },
      {
        seq: 3,
        name: "Twin wing masonry & courtyard portal",
        description: "Left and right residential suites framed alongside central dark-plaster connecting pavilion.",
        days: 24,
        laborUsd: 2400,
        criteria: "Waterproof cement additive used in lower 3 courses; true courtyard symmetry.",
        fundTx: "4OpQ7vL3mX8cQ5wK1bT9yF2jH6dA3sE8uZ4gM1nP5xQrM",
        releaseTx: "7PqR5wP2mX6cQ4vK8bT3yF6jH2dA9sE1uZ5gM7nP3xQpN",
      },
      {
        seq: 4,
        name: "Roof parapet slab & marine waterproofing",
        description: "Twin roof slabs cast and sealed with twin-coat elastomeric coastal membrane.",
        days: 18,
        laborUsd: 1900,
        criteria: "48h ponding flood test on roof deck passed zero damp ceiling spots.",
        fundTx: "1QrS8vL5mX2cQ7wK4bT6yF9jH3dA5sE2uZ8gM4nP9xQrO",
        releaseTx: "8RsT6wP3mX9cQ1vK5bT2yF8jH4dA7sE6uZ3gM1nP5xQpP",
      },
      {
        seq: 5,
        name: "Terracotta brise-soleil fins & MEP",
        description: "24 vertical terracotta louvers anchored across twin facades; RO water & AC piping chased.",
        days: 16,
        laborUsd: 1500,
        criteria: "Stainless brackets bolted into concrete reveals; AC drain pressure clean.",
        fundTx: "3StU2vL9mX4cQ6wK8bT1yF5jH7dA2sE9uZ4gM6nP3xQrQ",
        releaseTx: "6TuV4wP7mX1cQ8vK3bT9yF2jH5dA8sE4uZ1gM5nP9xQpR",
      },
      {
        seq: 6,
        name: "Elastomeric coat, deck & handover",
        description: "Salt-resistant plaster finishing, hardwood courtyard deck oiled, unit handed over.",
        days: 16,
        laborUsd: 1200,
        criteria: "All 6 milestones settled; Houston owners inspected via live handover call.",
        fundTx: "5UvW6vL2mX9cQ4wK7bT3yF1jH8dA6sE3uZ9gM2nP7xQrS",
        releaseTx: "2VwX9wP5mX3cQ7vK6bT4yF7jH1dA3sE8uZ6gM9nP2xQpT",
      },
    ],
  },
];
