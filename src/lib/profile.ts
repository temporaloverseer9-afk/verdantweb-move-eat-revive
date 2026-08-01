/** Curated, family-friendly animal avatars. Only these values are accepted server-side. */
export const ANIMAL_AVATARS = [
  "🐯",
  "🦁",
  "🐼",
  "🦊",
  "🐨",
  "🐧",
  "🦉",
  "🐢",
  "🐬",
  "🦋",
  "🐝",
  "🦌",
  "🐘",
  "🦥",
  "🦔",
  "🐳",
  "🦩",
  "🐝",
] as const;

export const AVATAR_CHOICES: string[] = Array.from(new Set(ANIMAL_AVATARS));

export const DEFAULT_AVATAR = "🐢";

export function isAllowedAvatar(value: string): boolean {
  return AVATAR_CHOICES.includes(value);
}

export type ProfileStats = {
  userId: string;
  username: string;
  avatar: string;
  totalPoints: number;
  weeklyPoints: number;
  greenKm: number;
  tripPoints: number;
  tripCount: number;
  foodPoints: number;
  mealCount: number;
  joinedAt: string;
};

export type Badge = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  /** 0–1 progress toward unlocking. */
  progress: number;
  unlocked: boolean;
  progressLabel: string;
};

function pct(value: number, target: number) {
  return Math.max(0, Math.min(1, value / target));
}

type Tier = { id: string; name: string; emoji: string; target: number };

const GREEN_KM_TIERS: Tier[] = [
  { id: "km-10", name: "First Tracks", emoji: "👣", target: 10 },
  { id: "km-50", name: "Trailblazer", emoji: "🥾", target: 50 },
  { id: "km-100", name: "Century Green", emoji: "🌍", target: 100 },
  { id: "km-500", name: "Long Hauler", emoji: "🏔️", target: 500 },
];

const FOOD_TIERS_BADGE: Tier[] = [
  { id: "food-25", name: "Fresh Start", emoji: "🥕", target: 25 },
  { id: "food-100", name: "Plant Powered", emoji: "🥦", target: 100 },
  { id: "food-250", name: "Garden Guru", emoji: "🌱", target: 250 },
];

const POINT_TIERS: Tier[] = [
  { id: "pts-100", name: "Sprout", emoji: "🌿", target: 100 },
  { id: "pts-500", name: "Grove Keeper", emoji: "🌳", target: 500 },
  { id: "pts-1000", name: "Forest Legend", emoji: "🏆", target: 1000 },
];

export function computeBadges(stats: ProfileStats): Badge[] {
  const greenKm = stats.greenKm;
  const foodPoints = Math.max(0, stats.foodPoints);
  const badges: Badge[] = [];

  for (const t of GREEN_KM_TIERS) {
    badges.push({
      id: t.id,
      name: t.name,
      emoji: t.emoji,
      description: `${t.target} km travelled sustainably`,
      progress: pct(greenKm, t.target),
      unlocked: greenKm >= t.target,
      progressLabel: `${greenKm.toFixed(1)} / ${t.target} km`,
    });
  }

  for (const t of FOOD_TIERS_BADGE) {
    badges.push({
      id: t.id,
      name: t.name,
      emoji: t.emoji,
      description: `${t.target} points of healthy food logged`,
      progress: pct(foodPoints, t.target),
      unlocked: foodPoints >= t.target,
      progressLabel: `${foodPoints} / ${t.target} food pts`,
    });
  }

  for (const t of POINT_TIERS) {
    badges.push({
      id: t.id,
      name: t.name,
      emoji: t.emoji,
      description: `${t.target} total green points`,
      progress: pct(stats.totalPoints, t.target),
      unlocked: stats.totalPoints >= t.target,
      progressLabel: `${stats.totalPoints} / ${t.target} pts`,
    });
  }

  badges.push({
    id: "trips-25",
    name: "Habit Formed",
    emoji: "📆",
    description: "25 trips logged",
    progress: pct(stats.tripCount, 25),
    unlocked: stats.tripCount >= 25,
    progressLabel: `${stats.tripCount} / 25 trips`,
  });

  badges.push({
    id: "meals-25",
    name: "Mindful Eater",
    emoji: "🍽️",
    description: "25 meals photographed",
    progress: pct(stats.mealCount, 25),
    unlocked: stats.mealCount >= 25,
    progressLabel: `${stats.mealCount} / 25 meals`,
  });

  return badges;
}
