import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AVATAR_CHOICES, type ProfileStats } from "@/lib/profile";

export const getProfileStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ userId: z.string().uuid().optional() }).parse(data ?? {}),
  )
  .handler(async ({ data, context }): Promise<ProfileStats | null> => {
    const target = data.userId ?? context.userId;
    const { data: rows, error } = await context.supabase.rpc("public_profile_stats", {
      _user_id: target,
    });
    if (error) throw new Error(error.message);
    const r = rows?.[0];
    if (!r) return null;
    return {
      userId: r.user_id,
      username: r.username,
      avatar: r.avatar,
      totalPoints: r.total_points,
      weeklyPoints: Number(r.weekly_points),
      greenKm: Number(r.green_km),
      tripPoints: Number(r.trip_points),
      tripCount: Number(r.trip_count),
      foodPoints: Number(r.food_points),
      mealCount: Number(r.meal_count),
      joinedAt: r.joined_at,
    };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        avatar: z.string().refine((v) => AVATAR_CHOICES.includes(v), "Avatar not allowed"),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ avatar: data.avatar })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
