import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { EcoFoodSection } from "@/components/EcoFoodSection";
import { TripTracker } from "@/components/TripTracker";
import { Button } from "@/components/ui/button";
import { getMe, getTrips, deleteTrip } from "@/lib/eco.functions";
import { MODES, type TransitMode } from "@/lib/eco";
import { formatDuration } from "@/lib/track";

export const Route = createFileRoute("/_authenticated/log")({
  head: () => ({
    meta: [
      { title: "Daily log & Eco Food — VerdantWeb" },
      {
        name: "description",
        content:
          "Every GPS-tracked trip you've taken, its verified transit mode, distance and the green points it earned.",
      },
      { property: "og:title", content: "Daily log & Eco Food — VerdantWeb" },
      {
        property: "og:description",
        content: "Review GPS-verified trips and the points each one earned.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LogPage,
});

function LogPage() {
  const queryClient = useQueryClient();
  const me = useServerFn(getMe);
  const trips = useServerFn(getTrips);
  const remove = useServerFn(deleteTrip);

  const profileQuery = useQuery({ queryKey: ["me"], queryFn: () => me({}) });
  const tripsQuery = useQuery({ queryKey: ["trips"], queryFn: () => trips({}) });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      toast.success("Trip removed");
    },
  });

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
        Trips must be tracked live with GPS — distance, speed and points are recalculated on the
        server from your recorded trace, so they can't be typed in or edited.
      </p>

      <TripTracker />

      <section className="mt-6 max-h-[36rem] space-y-6 overflow-y-auto pr-1">
        {tripsQuery.isLoading && <p className="text-sm text-muted-foreground">Loading trips…</p>}
        {!tripsQuery.isLoading && list.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No trips yet — start tracking above to record your first one.
          </p>
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
                      {t.speedKmh.toFixed(1)} km/h · {formatDuration(t.durationS)} ·{" "}
                      {t.pingCount} pings ·{" "}
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

      <EcoFoodSection />
    </AppShell>
  );
}
