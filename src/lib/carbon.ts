import type { TransitMode } from "@/lib/eco";

/**
 * Well-to-wheel emission factors in grams of CO2e per passenger-kilometre.
 * Sources: UK DEFRA / EEA average passenger transport factors.
 */
export const EMISSION_FACTORS: Record<TransitMode, number> = {
  walk: 0,
  cycle: 0,
  bus: 105,
  train: 41,
  car: 170,
};

/** Baseline used for "what if you had driven" comparisons. */
export const CAR_BASELINE = EMISSION_FACTORS.car;

/** A tree absorbs roughly 21 kg CO2 per year. */
export const KG_CO2_PER_TREE_YEAR = 21;

export type TripLike = {
  mode: TransitMode;
  distanceKm: number;
  verified: boolean;
  occurredAt: string;
};

export type ModeBreakdown = {
  mode: TransitMode;
  distanceKm: number;
  trips: number;
  emissionsKg: number;
  savedKg: number;
};

export type FootprintResult = {
  totalDistanceKm: number;
  emissionsKg: number;
  baselineKg: number;
  savedKg: number;
  treeYears: number;
  perKmGrams: number;
  byMode: ModeBreakdown[];
};

/**
 * Estimates emissions from recorded trips. Only GPS-verified trips count
 * toward savings — unverified active-mode traces fall back to the car factor
 * so a spoofed "walk" can never look cleaner than driving.
 */
export function computeFootprint(trips: TripLike[]): FootprintResult {
  const modes = new Map<TransitMode, ModeBreakdown>();
  let totalDistanceKm = 0;
  let emissionsG = 0;
  let baselineG = 0;

  for (const trip of trips) {
    const km = Number.isFinite(trip.distanceKm) ? Math.max(0, trip.distanceKm) : 0;
    if (km <= 0) continue;

    const effective =
      trip.mode === "car" || trip.verified ? EMISSION_FACTORS[trip.mode] : CAR_BASELINE;
    const emitted = km * effective;
    const baseline = km * CAR_BASELINE;

    totalDistanceKm += km;
    emissionsG += emitted;
    baselineG += baseline;

    const entry = modes.get(trip.mode) ?? {
      mode: trip.mode,
      distanceKm: 0,
      trips: 0,
      emissionsKg: 0,
      savedKg: 0,
    };
    entry.distanceKm += km;
    entry.trips += 1;
    entry.emissionsKg += emitted / 1000;
    entry.savedKg += (baseline - emitted) / 1000;
    modes.set(trip.mode, entry);
  }

  const emissionsKg = emissionsG / 1000;
  const baselineKg = baselineG / 1000;
  const savedKg = baselineKg - emissionsKg;

  return {
    totalDistanceKm,
    emissionsKg,
    baselineKg,
    savedKg,
    treeYears: savedKg / KG_CO2_PER_TREE_YEAR,
    perKmGrams: totalDistanceKm > 0 ? emissionsG / totalDistanceKm : 0,
    byMode: [...modes.values()].sort((a, b) => b.distanceKm - a.distanceKm),
  };
}

export type RangeKey = "7d" | "30d" | "all";

export const RANGES: { key: RangeKey; label: string; days: number | null }[] = [
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "all", label: "All time", days: null },
];

export function filterByRange<T extends { occurredAt: string }>(trips: T[], range: RangeKey): T[] {
  const spec = RANGES.find((r) => r.key === range);
  if (!spec?.days) return trips;
  const cutoff = Date.now() - spec.days * 86_400_000;
  return trips.filter((t) => new Date(t.occurredAt).getTime() >= cutoff);
}
