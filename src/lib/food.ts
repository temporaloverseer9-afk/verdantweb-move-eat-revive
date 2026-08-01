export type FoodTier = 1 | 2 | 3 | 4;

/** The food triangle, top (tier 4 index 0) to base. Farther down = more points. */
export const FOOD_TIERS: Record<
  FoodTier,
  { label: string; examples: string; points: number; emoji: string }
> = {
  4: {
    label: "Base — plants & grains",
    examples: "Vegetables, legumes, whole grains, potatoes",
    points: 14,
    emoji: "🥦",
  },
  3: {
    label: "Fruit & nuts",
    examples: "Fresh fruit, nuts, seeds, olive oil",
    points: 9,
    emoji: "🍎",
  },
  2: {
    label: "Dairy, eggs & fish",
    examples: "Yoghurt, cheese, eggs, poultry, fish",
    points: 4,
    emoji: "🐟",
  },
  1: {
    label: "Top — treats & red meat",
    examples: "Sweets, fried food, red meat, sugary drinks",
    points: -4,
    emoji: "🍰",
  },
};

/** Widest row at the bottom of the rendered triangle. */
export const TIER_ORDER: FoodTier[] = [1, 2, 3, 4];

export function foodPoints(tier: FoodTier) {
  return FOOD_TIERS[tier].points;
}
