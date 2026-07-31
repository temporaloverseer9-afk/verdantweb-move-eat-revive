import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, ShieldAlert, Trash2, Radar } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMe, getTrips, logTrip, deleteTrip } from "@/lib/eco.functions";
import { MODES, scoreTrip, type TransitMode } from "@/lib/eco";

export const Route = createFileRoute("/_authenticated/log")({
  head: () => ({
    meta: [
      { title: "Daily log — EcoMove" },
      {
        name: "description",
        content:
          "Every trip you've taken, its verified transit mode, distance and the green points it earned.",
      },
      { property: "og:title", content: "Daily log — EcoMove" },
      { property: "og:description", content: "Review verified trips and the points each one earned." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LogPage,
});

const MODE_KEYS = ["walk", "cycle", "bus", "train", "car"] as const;

function LogPage() {
  const queryClient = useQueryClient();
  const me = useServerFn(getMe);
  const trips = useServerFn(getTrips);
  const create = useServerFn(logTrip);
  const remove = useServerFn(deleteTrip);

  const profileQuery = useQuery({ queryKey: ["me"], queryFn: () => me({}) });
  const tripsQuery = useQuery({ queryKey: ["trips"], queryFn: () => trips({}) });

  const [mode, setMode] = useState<TransitMode>("walk");
  const [distance, setDistance] = useState("3.0");
  const [speed, setSpeed] = useState(String(MODES.walk.defaultSpeed));

  const distanceNum = Number(distance) || 0;
  const speedNum = Number(speed) || 0;
  const preview = scoreTrip(mode, distanceNum, speedNum);
  const pings = Math.max(1, Math.round(((distanceNum / Math.max(speedNum, 1)) * 3600) / 45));

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["trips"] });
    queryClient.invalidateQueries({ queryKey: ["me"] });
    queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
  };

  const addMutation = useMutation({
    mutationFn: (vars: { mode: TransitMode; distance_km: number; avg_speed_kmh: number }) =>
      create({ data: vars }),
    onSuccess: (res) => {
      invalidate();
      toast.success(
        res.verified
          ? `Verified trip logged — ${res.points > 0 ? "+" : ""}${res.points} points`
          : `Verification failed — ${res.points} points`,
      );
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not log trip"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      invalidate();
      toast.success("Trip removed");
    },
  });

  function selectMode(m: TransitMode) {
    setMode(m);
    setSpeed(String(MODES[m].defaultSpeed));
  }

  function simulate() {
    const keys = MODE_KEYS;
    const m = keys[Math.floor(Math.random() * keys.length)] as TransitMode;
    const [min, max] = MODES[m].speed;
    const km = Number((Math.random() * 8 + 0.8).toFixed(1));
    const kmh = Number((min + Math.random() * (max - min)).toFixed(1));
    setMode(m);
    setDistance(String(km));
    setSpeed(String(kmh));
    addMutation.mutate({ mode: m, distance_km: km, avg_speed_kmh: kmh });
  }

  const list = tripsQuery.data ?? [];
  const groups = list.reduce<Record<string, typeof list>>((acc, t) => {
    const key = new Date(t.occurredAt).toDateString();
    (acc[key] ??= []).push(t);
    return acc;
  }, {});

  return (
    <AppShell username={profileQuery.data?.username}>
      <h1 className="text-2xl font-bold">Daily log</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Trips are scored on the server. Speed outside the verified band for a mode counts as a
        failed check and costs points.
      </p>

      <section className="surface-card mt-5 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-base font-semibold">Add a trip</h2>
          <Button variant="outline" size="sm" onClick={simulate} disabled={addMutation.isPending}>
            <Radar className="size-4" /> Simulate tracking
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {MODE_KEYS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => selectMode(m)}
              className={`rounded-xl border p-3 text-center text-sm transition-colors ${
                mode === m
                  ? "border-primary bg-secondary text-secondary-foreground"
                  : "border-border hover:bg-muted"
              }`}
            >
              <span className="block text-xl">{MODES[m].emoji}</span>
              <span className="mt-1 block font-medium">{MODES[m].label}</span>
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">{MODES[mode].sensor}</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="distance">Distance (km)</Label>
            <Input
              id="distance"
              type="number"
              step="0.1"
              min="0.1"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="speed">Average speed (km/h)</Label>
            <Input
              id="speed"
              type="number"
              step="0.1"
              min="0"
              value={speed}
              onChange={(e) => setSpeed(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted p-4">
          <div className="text-sm">
            <p className="font-medium">
              {preview.verified ? "Would verify" : "Would fail verification"}
            </p>
            <p className="text-muted-foreground">
              ~{pings} GPS pings at 45s intervals · {MODES[mode].rate > 0 ? "+" : ""}
              {MODES[mode].rate} pts/km
            </p>
          </div>
          <span
            className={`font-display text-2xl font-bold tabular-nums ${
              preview.points >= 0 ? "text-primary" : "text-destructive"
            }`}
          >
            {preview.points > 0 ? "+" : ""}
            {preview.points}
          </span>
        </div>

        <Button
          className="mt-4 w-full"
          disabled={addMutation.isPending || distanceNum <= 0}
          onClick={() =>
            addMutation.mutate({
              mode,
              distance_km: distanceNum,
              avg_speed_kmh: speedNum,
            })
          }
        >
          Log trip
        </Button>
      </section>

      <section className="mt-6 space-y-6">
        {tripsQuery.isLoading && <p className="text-sm text-muted-foreground">Loading trips…</p>}
        {!tripsQuery.isLoading && list.length === 0 && (
          <p className="text-sm text-muted-foreground">No trips yet — log your first one above.</p>
        )}
        {Object.entries(groups).map(([day, dayTrips]) => (
          <div key={day}>
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {day}
              </h2>
              <span className="text-sm tabular-nums text-muted-foreground">
                {dayTrips.reduce((s, t) => s + t.points, 0)} pts
              </span>
            </div>
            <ul className="mt-2 space-y-2">
              {dayTrips.map((t) => (
                <li key={t.id} className="surface-card flex items-center gap-3 p-4">
                  <span className="text-2xl">{MODES[t.mode as TransitMode].emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {MODES[t.mode as TransitMode].label}{" "}
                      {t.verified ? "verified" : "unverified"} — {t.distanceKm.toFixed(1)} km
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      {t.verified ? (
                        <BadgeCheck className="size-3.5 text-primary" />
                      ) : (
                        <ShieldAlert className="size-3.5 text-destructive" />
                      )}
                      {t.speedKmh.toFixed(1)} km/h ·{" "}
                      {new Date(t.occurredAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span
                    className={`font-display text-lg font-bold tabular-nums ${
                      t.points >= 0 ? "text-primary" : "text-destructive"
                    }`}
                  >
                    {t.points > 0 ? "+" : ""}
                    {t.points}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete trip"
                    onClick={() => deleteMutation.mutate(t.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
