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
