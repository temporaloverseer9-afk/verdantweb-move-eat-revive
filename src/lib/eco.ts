export type TransitMode = "walk" | "cycle" | "bus" | "train" | "car";

export const MODES: Record<
  TransitMode,
  {
    label: string;
    rate: number;
    speed: [number, number];
    defaultSpeed: number;
    sensor: string;
    emoji: string;
  }
> = {
  walk: {
    label: "Walking",
    rate: 5,
    speed: [2, 8],
    defaultSpeed: 5,
    sensor: "Step counter (CoreMotion / ActivityRecognition)",
    emoji: "🚶",
  },
  cycle: {
    label: "Cycling",
    rate: 3,
    speed: [10, 25],
    defaultSpeed: 17,
    sensor: "Accelerometer cadence + bike-path map match",
    emoji: "🚲",
  },
  bus: {
    label: "Bus",
    rate: 2,
    speed: [9, 60],
    defaultSpeed: 24,
    sensor: "Route match against transit lines",
    emoji: "🚌",
  },
  train: {
    label: "Train",
    rate: 2,
    speed: [9, 200],
    defaultSpeed: 60,
    sensor: "Route match against rail lines",
    emoji: "🚆",
  },
  car: {
    label: "Private car",
    rate: -1,
    speed: [0, 200],
    defaultSpeed: 45,
    sensor: "No human-effort signal — penalised",
    emoji: "🚗",
  },
};

/** Mirrors the server-side scoring engine so the UI can preview points. */
export function scoreTrip(mode: TransitMode, distanceKm: number, speedKmh: number) {
  const [min, max] = MODES[mode].speed;
  let verified: boolean;
  if (mode === "walk" || mode === "cycle") verified = speedKmh >= min && speedKmh <= max;
  else if (mode === "bus" || mode === "train") verified = speedKmh > 8;
  else verified = false;

  // An honestly logged car trip costs half; failed verification of an active
  // mode keeps the full penalty.
  const points =
    mode === "car"
      ? -Math.ceil(distanceKm / 2)
      : !verified
        ? -Math.ceil(distanceKm)
        : Math.round(distanceKm * MODES[mode].rate);

  return { verified, points };
}

export const WEEKLY_GOAL = 250;
export const DAILY_GOAL = 40;
