export type Ping = { lat: number; lng: number; t: number; acc: number };

/** GPS sample interval used by the tracker, in milliseconds. */
export const PING_INTERVAL_MS = 45_000;
/** A trip must be tracked for at least this long to be verifiable. */
export const MIN_DURATION_S = 60;
/** A trip needs at least this many GPS samples. */
export const MIN_PINGS = 3;
/** Samples less accurate than this are discarded. */
export const MAX_ACCURACY_M = 100;

export function haversineKm(a: Ping, b: Ping) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export type TrackStats = {
  distanceKm: number;
  durationS: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  accuracyM: number;
  pings: number;
};

/**
 * Derives trip stats purely from the recorded GPS trace. The same function runs
 * on the client (for the live readout) and on the server (as the source of
 * truth), so a tampered client cannot inflate distance or speed.
 */
export function statsFromPath(path: Ping[]): TrackStats {
  let distanceKm = 0;
  let maxSpeedKmh = 0;
  let accSum = 0;
  for (let i = 0; i < path.length; i++) {
    accSum += path[i]!.acc;
    if (i === 0) continue;
    const a = path[i - 1]!;
    const b = path[i]!;
    const d = haversineKm(a, b);
    const dt = (b.t - a.t) / 1000;
    if (dt <= 0) continue;
    const speed = (d / dt) * 3600;
    // Ignore single-sample GPS jitter spikes above any plausible ground speed.
    if (speed > 400) continue;
    distanceKm += d;
    if (speed > maxSpeedKmh) maxSpeedKmh = speed;
  }
  const durationS = path.length > 1 ? (path[path.length - 1]!.t - path[0]!.t) / 1000 : 0;
  const avgSpeedKmh = durationS > 0 ? (distanceKm / durationS) * 3600 : 0;
  return {
    distanceKm,
    durationS,
    avgSpeedKmh,
    maxSpeedKmh,
    accuracyM: path.length ? accSum / path.length : 0,
    pings: path.length,
  };
}

/** Returns a human-readable reason the trace is unusable, or null when fine. */
export function pathProblem(path: Ping[]): string | null {
  if (path.length < MIN_PINGS) return `Needs at least ${MIN_PINGS} GPS samples`;
  for (let i = 1; i < path.length; i++) {
    if (path[i]!.t <= path[i - 1]!.t) return "GPS samples are out of order";
    if (path[i]!.t - path[i - 1]!.t > 300_000) return "Tracking gap longer than 5 minutes";
  }
  const s = statsFromPath(path);
  if (s.durationS < MIN_DURATION_S) return "Trip is too short to verify";
  if (s.distanceKm < 0.1) return "You barely moved";
  if (s.accuracyM > MAX_ACCURACY_M) return "GPS accuracy too poor to verify";
  return null;
}

export function formatDuration(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m ${s % 60}s`;
}
