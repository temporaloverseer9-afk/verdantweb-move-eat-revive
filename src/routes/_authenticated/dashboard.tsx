import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Flame, TrendingUp, Trophy, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { getMe, getTrips } from "@/lib/eco.functions";
import { MODES, WEEKLY_GOAL, DAILY_GOAL, type TransitMode } from "@/lib/eco";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Eco-Scoreboard — EcoMove" },
      { name: "description", content: "Your live eco-scoreboard: daily and weekly green points, distance covered and progress toward your goals." },
      { property: "og:title", content: "Eco-Scoreboard — EcoMove" },
      { property: "og:description", content: "Track daily and weekly green points earned from verified trips." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function startOfWeek() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

function ProgressBar({ value, goal, tone }: { value: number; goal: number; tone: "eco" | "sun" }) {
  const pct = Math.max(0, Math.min(100, (value / goal) * 100));
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
      <div
        className={`h-full rounded-full transition-all duration-700 ${tone === "eco" ? "gradient-eco" : "gradient-sun"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function Dashboard() {
  const me = useServerFn(getMe);
  const trips = useServerFn(getTrips);
  const profileQuery = useQuery({ queryKey: ["me"], queryFn: () => me({}) });
  const tripsQuery = useQuery({ queryKey: ["trips"], queryFn: () => trips({}) });

  const list = tripsQuery.data ?? [];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = startOfWeek();

  const today = list.filter((t) => new Date(t.occurredAt) >= todayStart);
  const week = list.filter((t) => new Date(t.occurredAt) >= weekStart);

  const dailyPoints = today.reduce((s, t) => s + t.points, 0);
  const weeklyPoints = week.reduce((s, t) => s + t.points, 0);
  const dailyDistance = today.reduce((s, t) => s + t.distanceKm, 0);
  const greenKm = week
    .filter((t) => t.verified && t.mode !== "car")
    .reduce((s, t) => s + t.distanceKm, 0);

  const byMode = (["walk", "cycle", "bus", "train", "car"] as TransitMode[])
    .map((m) => ({ mode: m, km: week.filter((t) => t.mode === m).reduce((s, t) => s + t.distanceKm, 0) }))
    .filter((r) => r.km > 0);

  return (
    <AppShell username={profileQuery.data?.username}>
      <section className="gradient-eco shadow-lift relative overflow-hidden rounded-3xl p-6 text-primary-foreground">
        <p className="text-sm/6 opacity-90">Today's eco-score</p>
        <p className="font-display mt-1 text-6xl font-bold tabular-nums">
          {dailyPoints > 0 ? "+" : ""}
          {dailyPoints}
        </p>
        <p className="mt-1 text-sm opacity-90">
          {dailyDistance.toFixed(1)} km tracked across {today.length} trip
          {today.length === 1 ? "" : "s"}
        </p>

        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-xs font-medium opacity-90">
            <span>Daily goal</span>
            <span>
              {Math.max(dailyPoints, 0)} / {DAILY_GOAL} pts
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-primary-foreground/25">
            <div
              className="h-full rounded-full bg-primary-foreground transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(0, (dailyPoints / DAILY_GOAL) * 100))}%` }}
            />
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="surface-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Flame className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Weekly points</span>
          </div>
          <p className="font-display mt-2 text-3xl font-bold tabular-nums">{weeklyPoints}</p>
          <div className="mt-3">
            <ProgressBar value={weeklyPoints} goal={WEEKLY_GOAL} tone="eco" />
            <p className="mt-1 text-xs text-muted-foreground">Goal {WEEKLY_GOAL} pts</p>
          </div>
        </div>
        <div className="surface-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Green km</span>
          </div>
          <p className="font-display mt-2 text-3xl font-bold tabular-nums">{greenKm.toFixed(1)}</p>
          <p className="mt-1 text-xs text-muted-foreground">verified this week</p>
        </div>
        <div className="surface-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Trophy className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wide">All-time</span>
          </div>
          <p className="font-display mt-2 text-3xl font-bold tabular-nums">
            {profileQuery.data?.total_points ?? 0}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">total green points</p>
        </div>
      </section>

      {byMode.length > 0 && (
        <section className="surface-card mt-4 p-5">
          <h2 className="font-display text-base font-semibold">This week by mode</h2>
          <div className="mt-4 space-y-3">
            {byMode.map(({ mode, km }) => {
              const max = Math.max(...byMode.map((b) => b.km));
              return (
                <div key={mode} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-sm">
                    {MODES[mode].emoji} {MODES[mode].label}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={mode === "car" ? "h-full rounded-full bg-destructive" : "gradient-eco h-full rounded-full"}
                      style={{ width: `${(km / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-14 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                    {km.toFixed(1)} km
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <Button asChild size="lg" className="mt-4 w-full">
        <Link to="/log">
          <Plus className="size-4" /> Log a trip
        </Link>
      </Button>
    </AppShell>
  );
}
