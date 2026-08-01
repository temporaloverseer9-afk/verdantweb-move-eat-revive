import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const tripInput = z.object({
  mode: z.enum(["walk", "cycle", "bus", "train", "car"]),
  distance_km: z.number().positive().max(500),
  avg_speed_kmh: z.number().min(0).max(400),
});

export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, username, total_points")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const getTrips = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("trips")
      .select("id, mode, distance_km, avg_speed_kmh, verified, points, occurred_at")
      .eq("user_id", context.userId)
      .order("occurred_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []).map((t) => ({
      id: t.id,
      mode: t.mode,
      distanceKm: Number(t.distance_km),
      speedKmh: Number(t.avg_speed_kmh),
      verified: t.verified,
      points: t.points,
      occurredAt: t.occurred_at,
    }));
  });

export const logTrip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => tripInput.parse(data))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("trips")
      .insert({ ...data, user_id: context.userId })
      .select("id, mode, distance_km, verified, points")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id, verified: row.verified, points: row.points };
  });

export const deleteTrip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("trips")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("weekly_leaderboard");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      userId: r.user_id,
      username: r.username,
      avatar: r.avatar,
      weeklyPoints: Number(r.weekly_points),
      totalPoints: r.total_points,
    }));
  });
