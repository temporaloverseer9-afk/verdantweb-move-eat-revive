import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { pathProblem, statsFromPath, type Ping } from "@/lib/track";

const pingSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  t: z.number().int().positive(),
  acc: z.number().min(0).max(10000),
});

const trackedTripInput = z.object({
  mode: z.enum(["walk", "cycle", "bus", "train", "car"]),
  path: z.array(pingSchema).min(3).max(4000),
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
      .select(
        "id, mode, distance_km, avg_speed_kmh, verified, points, occurred_at, duration_s, ping_count, gps_path",
      )
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
      durationS: t.duration_s ?? 0,
      pingCount: t.ping_count ?? 0,
      path: Array.isArray(t.gps_path)
        ? (t.gps_path as unknown as Ping[]).map((p) => [p.lat, p.lng] as [number, number])
        : [],
    }));
  });

/**
 * The only way to record a trip. Distance, speed and duration are recomputed
 * from the submitted GPS trace on the server — client-sent totals are ignored,
 * and traces that are too short, too sparse, too inaccurate or physically
 * impossible are rejected outright.
 */
export const logTrackedTrip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => trackedTripInput.parse(data))
  .handler(async ({ data, context }) => {
    const now = Date.now();
    const path = data.path.filter((p) => p.acc <= 150);
    const problem = pathProblem(path);
    if (problem) throw new Error(problem);

    const first = path[0]!;
    const last = path[path.length - 1]!;
    if (last.t > now + 120_000) throw new Error("Trip timestamps are in the future");
    if (now - first.t > 24 * 3600_000) throw new Error("Trip is too old to submit");

    const stats = statsFromPath(path);
    if (stats.distanceKm > 500) throw new Error("Trip distance is implausible");

    // Reject a trace that overlaps a trip already recorded for this user.
    const { data: recent } = await context.supabase
      .from("trips")
      .select("occurred_at, duration_s")
      .eq("user_id", context.userId)
      .gte("occurred_at", new Date(first.t - 24 * 3600_000).toISOString());
    const overlaps = (recent ?? []).some((r) => {
      const end = new Date(r.occurred_at).getTime();
      const start = end - (r.duration_s ?? 0) * 1000;
      return first.t < end && last.t > start;
    });
    if (overlaps) throw new Error("This trip overlaps one you already recorded");

    const { data: row, error } = await context.supabase
      .from("trips")
      .insert({
        user_id: context.userId,
        mode: data.mode,
        distance_km: Number(stats.distanceKm.toFixed(3)),
        avg_speed_kmh: Number(stats.avgSpeedKmh.toFixed(2)),
        max_speed_kmh: Number(stats.maxSpeedKmh.toFixed(2)),
        accuracy_m: Number(stats.accuracyM.toFixed(1)),
        duration_s: Math.round(stats.durationS),
        ping_count: path.length,
        gps_path: path,
        occurred_at: new Date(last.t).toISOString(),
      })
      .select("id, verified, points, distance_km")
      .single();
    if (error) throw new Error(error.message);
    return {
      id: row.id,
      verified: row.verified,
      points: row.points,
      distanceKm: Number(row.distance_km),
    };
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
