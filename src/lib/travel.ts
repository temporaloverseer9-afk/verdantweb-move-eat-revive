/**
 * Curated low-carbon getaways from Singapore.
 * Emission figures are per-passenger, one-way estimates using average
 * well-to-wheel factors (g CO2e per passenger-km).
 */
export type TravelScope = "local" | "international";

export type TravelMode = "walk" | "cycle" | "bus" | "train" | "mrt" | "ferry" | "coach";

export const TRAVEL_MODES: Record<TravelMode, { label: string; emoji: string; gPerKm: number }> = {
  walk: { label: "On foot", emoji: "🚶", gPerKm: 0 },
  cycle: { label: "Cycling", emoji: "🚲", gPerKm: 0 },
  mrt: { label: "MRT", emoji: "🚇", gPerKm: 28 },
  train: { label: "Rail", emoji: "🚆", gPerKm: 41 },
  bus: { label: "Public bus", emoji: "🚌", gPerKm: 105 },
  coach: { label: "Cross-border coach", emoji: "🚍", gPerKm: 68 },
  ferry: { label: "Ferry / boat", emoji: "⛴️", gPerKm: 115 },
};

/** Short-haul flight factor, used for the "instead of flying" comparison. */
export const FLIGHT_G_PER_KM = 255;
/** Private car factor, used for the local comparison. */
export const CAR_G_PER_KM = 170;

export type Destination = {
  id: string;
  name: string;
  country: string;
  scope: TravelScope;
  mode: TravelMode;
  distanceKm: number;
  travelTime: string;
  from: string;
  blurb: string;
  highlights: string[];
};

export const DESTINATIONS: Destination[] = [
  // ── International (low-carbon border hops) ─────────────────────────────
  {
    id: "johor-bahru",
    name: "Johor Bahru",
    country: "Malaysia",
    scope: "international",
    mode: "coach",
    distanceKm: 30,
    travelTime: "1 h – 1 h 30 m",
    from: "Queen Street / Kranji",
    blurb:
      "The classic day trip across the Causeway. Cross-border coaches carry dozens of passengers, so the per-head footprint stays tiny.",
    highlights: ["Jalan Dhoby heritage shophouses", "Johor Bahru Old Chinese Temple", "Night markets"],
  },
  {
    id: "batam",
    name: "Batam",
    country: "Indonesia",
    scope: "international",
    mode: "ferry",
    distanceKm: 25,
    travelTime: "1 h",
    from: "HarbourFront Centre",
    blurb:
      "A one-hour boat ride to Riau Island beaches and seafood. Ferries beat any flight on this route by a wide margin.",
    highlights: ["Nongsa beaches", "Barelang Bridge", "Seafood kelongs"],
  },
  {
    id: "bintan",
    name: "Bintan",
    country: "Indonesia",
    scope: "international",
    mode: "ferry",
    distanceKm: 50,
    travelTime: "1 h 30 m",
    from: "Tanah Merah Ferry Terminal",
    blurb: "Quiet mangroves and long sand beaches, reachable entirely by boat.",
    highlights: ["Mangrove river tour", "Trikora Beach", "Bintan Lagoon"],
  },
  {
    id: "desaru",
    name: "Desaru Coast",
    country: "Malaysia",
    scope: "international",
    mode: "ferry",
    distanceKm: 60,
    travelTime: "1 h 30 m",
    from: "Tanah Merah Ferry Terminal",
    blurb: "East-coast Johor beaches via a direct ferry link — no long road transfer needed.",
    highlights: ["Desaru beach walk", "Fruit farm tours", "Sungai Lebam kayaking"],
  },
  {
    id: "melaka",
    name: "Melaka",
    country: "Malaysia",
    scope: "international",
    mode: "coach",
    distanceKm: 245,
    travelTime: "4 h",
    from: "Golden Mile / Boon Lay",
    blurb:
      "A UNESCO-listed old town within a single coach ride. Still a fraction of the emissions of the equivalent flight.",
    highlights: ["Jonker Street", "Dutch Square", "Melaka River walk"],
  },
  {
    id: "kuala-lumpur",
    name: "Kuala Lumpur",
    country: "Malaysia",
    scope: "international",
    mode: "train",
    distanceKm: 350,
    travelTime: "7 h – 9 h (rail via JB)",
    from: "Woodlands CIQ → JB Sentral",
    blurb:
      "Take the Shuttle Tebrau then the KTM Electric Train Service north. Slower than flying, but a fraction of the carbon.",
    highlights: ["Batu Caves", "Merdeka Square", "Lake Gardens"],
  },
  {
    id: "penang",
    name: "Penang",
    country: "Malaysia",
    scope: "international",
    mode: "train",
    distanceKm: 690,
    travelTime: "11 h – 13 h (rail via JB & KL)",
    from: "Woodlands CIQ → Butterworth",
    blurb: "The long, scenic overland run to George Town — an overnight-style rail adventure.",
    highlights: ["George Town street art", "Penang Hill", "Kek Lok Si Temple"],
  },

  // ── Local (Singapore) ──────────────────────────────────────────────────
  {
    id: "pulau-ubin",
    name: "Pulau Ubin",
    country: "Singapore",
    scope: "local",
    mode: "ferry",
    distanceKm: 3,
    travelTime: "10 m bumboat",
    from: "Changi Point Ferry Terminal",
    blurb: "Singapore's last kampong. Bumboat over, then explore entirely by bicycle.",
    highlights: ["Chek Jawa wetlands", "Ubin Quarry", "Bike loop trails"],
  },
  {
    id: "coney-island",
    name: "Coney Island Park",
    country: "Singapore",
    scope: "local",
    mode: "cycle",
    distanceKm: 12,
    travelTime: "45 m by bike from Punggol",
    from: "Punggol Waterway",
    blurb: "Rustic coastal woodland linked straight into the Round Island Route — zero-emission access.",
    highlights: ["Casuarina Exploration Trail", "Beach areas A–E", "Birdwatching hides"],
  },
  {
    id: "southern-ridges",
    name: "Southern Ridges",
    country: "Singapore",
    scope: "local",
    mode: "walk",
    distanceKm: 10,
    travelTime: "3 h walk",
    from: "HarbourFront MRT",
    blurb: "Ten kilometres of connected parks and canopy bridges, walkable end to end.",
    highlights: ["Henderson Waves", "Forest Walk", "Mount Faber"],
  },
  {
    id: "sungei-buloh",
    name: "Sungei Buloh Wetland Reserve",
    country: "Singapore",
    scope: "local",
    mode: "bus",
    distanceKm: 22,
    travelTime: "1 h by MRT + bus",
    from: "Kranji MRT",
    blurb: "Mangrove boardwalks and migratory birds at the north-west edge of the island.",
    highlights: ["Migratory bird hides", "Mangrove boardwalk", "Mudflat crabs"],
  },
  {
    id: "st-johns",
    name: "St John's & Lazarus Island",
    country: "Singapore",
    scope: "local",
    mode: "ferry",
    distanceKm: 8,
    travelTime: "30 m ferry",
    from: "Marina South Pier",
    blurb: "Quiet Southern Islands lagoons a short public ferry hop from the mainland.",
    highlights: ["Lazarus beach", "Island causeway walk", "Kias picnic spots"],
  },
  {
    id: "macritchie",
    name: "MacRitchie TreeTop Walk",
    country: "Singapore",
    scope: "local",
    mode: "mrt",
    distanceKm: 14,
    travelTime: "40 m by MRT + short walk",
    from: "Caldecott MRT",
    blurb: "Rainforest trails and a suspension bridge in the middle of the island.",
    highlights: ["TreeTop Walk", "Reservoir boardwalk", "Long-tailed macaques"],
  },
  {
    id: "changi-point",
    name: "Changi Point & Beach",
    country: "Singapore",
    scope: "local",
    mode: "bus",
    distanceKm: 25,
    travelTime: "1 h by MRT + bus",
    from: "Tanah Merah MRT",
    blurb: "Old-school seaside village atmosphere, boardwalks and a long quiet beach.",
    highlights: ["Changi Boardwalk", "Changi Village hawker centre", "Sailing point"],
  },
];

export function tripEmissionsKg(d: Destination) {
  return (d.distanceKm * TRAVEL_MODES[d.mode].gPerKm) / 1000;
}

/** Emissions of the same journey by the usual alternative (flight or car). */
export function baselineEmissionsKg(d: Destination) {
  const factor = d.scope === "international" ? FLIGHT_G_PER_KM : CAR_G_PER_KM;
  return (d.distanceKm * factor) / 1000;
}

/** Where every journey starts from, for map routes. */
export const SG_CENTER: [number, number] = [1.3521, 103.8198];

/** Departure point coordinates, keyed by destination id. */
export const DEPARTURE_COORDS: Record<string, [number, number]> = {
  "johor-bahru": [1.4382, 103.7614], // Kranji / Woodlands checkpoint
  batam: [1.2644, 103.8203], // HarbourFront Centre
  bintan: [1.3243, 103.9884], // Tanah Merah Ferry Terminal
  desaru: [1.3243, 103.9884],
  melaka: [1.3072, 103.8635], // Golden Mile Complex
  "kuala-lumpur": [1.4382, 103.7691], // Woodlands CIQ
  penang: [1.4382, 103.7691],
  "pulau-ubin": [1.3903, 103.9885], // Changi Point Ferry Terminal
  "coney-island": [1.4043, 103.9092], // Punggol Waterway
  "southern-ridges": [1.2653, 103.8221], // HarbourFront MRT
  "sungei-buloh": [1.4251, 103.7620], // Kranji MRT
  "st-johns": [1.2712, 103.8632], // Marina South Pier
  macritchie: [1.3378, 103.8395], // Caldecott MRT
  "changi-point": [1.3244, 103.9463], // Tanah Merah MRT
};

/** Destination coordinates, keyed by destination id. */
export const DESTINATION_COORDS: Record<string, [number, number]> = {
  "johor-bahru": [1.4927, 103.7414],
  batam: [1.1301, 104.0529],
  bintan: [1.1541, 104.5000],
  desaru: [1.5533, 104.2650],
  melaka: [2.1896, 102.2501],
  "kuala-lumpur": [3.1390, 101.6869],
  penang: [5.4141, 100.3288],
  "pulau-ubin": [1.4043, 103.9631],
  "coney-island": [1.4114, 103.9214],
  "southern-ridges": [1.2795, 103.8028],
  "sungei-buloh": [1.4460, 103.7292],
  "st-johns": [1.2200, 103.8480],
  macritchie: [1.3444, 103.8250],
  "changi-point": [1.3899, 103.9887],
};

/** Line style for a route drawn on the map, by mode. */
export const MODE_ROUTE_STYLE: Record<TravelMode, { color: string; dash?: string }> = {
  walk: { color: "#16a34a", dash: "2 8" },
  cycle: { color: "#0d9488", dash: "6 6" },
  mrt: { color: "#7c3aed" },
  train: { color: "#2563eb" },
  bus: { color: "#ea580c", dash: "10 6" },
  coach: { color: "#b45309", dash: "12 6" },
  ferry: { color: "#0284c7", dash: "4 8" },
};
