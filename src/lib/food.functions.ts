import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const foodInput = z.object({
  label: z.string().min(1).max(80),
  tier: z.number().int().min(1).max(4),
  note: z.string().max(300).optional(),
});

export const getFoodLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("food_logs")
      .select("id, label, tier, note, points, occurred_at")
      .eq("user_id", context.userId)
      .order("occurred_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []).map((f) => ({
      id: f.id,
      label: f.label,
      tier: f.tier as 1 | 2 | 3 | 4,
      note: f.note,
      points: f.points,
      occurredAt: f.occurred_at,
    }));
  });

export const logFood = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => foodInput.parse(data))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("food_logs")
      .insert({
        user_id: context.userId,
        label: data.label,
        tier: data.tier,
        note: data.note ?? null,
      })
      .select("id, label, tier, points")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id, label: row.label, tier: row.tier, points: row.points };
  });

export const deleteFood = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("food_logs")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const analyzeFoodPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ image: z.string().startsWith("data:image/").max(8_000_000) }).parse(data),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You classify a photographed meal onto the food triangle. Tier 4 = base: vegetables, legumes, whole grains, potatoes. Tier 3 = fruit, nuts, seeds, healthy oils. Tier 2 = dairy, eggs, poultry, fish. Tier 1 = top: sweets, fried food, red meat, sugary drinks. Use the dominant component of the meal. Reply ONLY with compact JSON: {\"label\":string (max 5 words),\"tier\":1|2|3|4,\"note\":string (max 15 words)}. If no food is visible, use tier 1 with label \"No food detected\".",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Classify this meal." },
              { type: "image_url", image_url: { url: data.image } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("Too many requests — try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted — add credits to continue.");
      throw new Error(`Food analysis failed [${res.status}]: ${body}`);
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = json.choices?.[0]?.message?.content ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Could not read the AI response");
    const parsed = z
      .object({
        label: z.string().min(1).max(80),
        tier: z.number().int().min(1).max(4),
        note: z.string().max(300).optional(),
      })
      .parse(JSON.parse(match[0]));
    return parsed;
  });
