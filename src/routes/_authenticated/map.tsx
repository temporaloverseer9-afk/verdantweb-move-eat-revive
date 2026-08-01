import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Crosshair, MapPin } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { getMe, getTrips } from "@/lib/eco.functions";
import { MODES, type TransitMode } from "@/lib/eco";

const TripMap = lazy(() => import("@/components/TripMap"));

// VerdantWeb is Singapore-centred, so fall back to the city centre here.
const FALLBACK_CENTER: [number, number] = [1.3521, 103.8198];

export const Route = createFileRoute("/_authenticated/map")({
  head: () => ({
    meta: [
      { title: "Live map — VerdantWeb" },
      {
        name: "description",
        content:
          "See where you are right now and trace the route of your most recent logged journey on the map.",
      },
      { property: "og:title", content: "Live map — VerdantWeb" },
      {
        property: "og:description",
        content: "Your current location plus the path of your latest trip.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const me = useServerFn(getMe);
  const trips = useServerFn(getTrips);
  const profileQuery = useQuery({ queryKey: ["me"], queryFn: () => me({}) });
  const tripsQuery = useQuery({ queryKey: ["trips"], queryFn: () => trips({}) });

  const [center, setCenter] = useState<[number, number] | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "locating" | "denied">("idle");
  const watchId = useRef<number | null>(null);

  const clearWatch = useCallback(() => {
    if (watchId.current !== null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("denied");
      setCenter(FALLBACK_CENTER);
      return;
    }
    clearWatch();
    setStatus("locating");
    let best = Infinity;
    const started = Date.now();
    // Keep sampling until the fix tightens up — the first fix is often a
    // coarse IP/wifi guess that can be hundreds of km off.
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const acc = pos.coords.accuracy ?? Infinity;
        if (acc <= best) {
          best = acc;
          setCenter([pos.coords.latitude, pos.coords.longitude]);
          setAccuracy(acc);
        }
        setStatus("idle");
        if (acc <= 50 || Date.now() - started > 20000) clearWatch();
      },
      () => {
        clearWatch();
        setStatus("denied");
        setCenter((c) => c ?? FALLBACK_CENTER);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 25000 },
    );
  }, [clearWatch]);

  useEffect(() => {
    locate();
    return clearWatch;
  }, [locate, clearWatch]);


  const latest = tripsQuery.data?.[0] ?? null;

  return (
    <AppShell username={profileQuery.data?.username}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Live map</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your current position, with the path of your most recent journey traced from it.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={locate} disabled={status === "locating"}>
          <Crosshair className="size-4" /> Recentre
        </Button>
      </div>

      {status === "denied" ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Location unavailable — showing Singapore city centre instead.
        </p>
      ) : accuracy !== null ? (
        <p className="mt-3 text-xs text-muted-foreground">
          GPS fix accurate to ±{Math.round(accuracy)} m
          {accuracy > 200 ? " — move outdoors for a sharper fix." : "."}
        </p>
      ) : null}

      <section className="surface-card mt-5 overflow-hidden p-2">
        {center ? (
          <Suspense
            fallback={
              <div className="flex h-[420px] items-center justify-center text-sm text-muted-foreground">
                Loading map…
              </div>
            }
          >
            <TripMap
              center={center}
              trip={
                latest
                  ? {
                      id: latest.id,
                      mode: latest.mode,
                      distanceKm: latest.distanceKm,
                      verified: latest.verified,
                      points: latest.points,
                      path: latest.path as [number, number][],

                    }
                  : null
              }
            />
          </Suspense>
        ) : (
          <div className="flex h-[420px] items-center justify-center text-sm text-muted-foreground">
            Finding your location…
          </div>
        )}
      </section>

      <section className="surface-card mt-4 flex items-center gap-3 p-4">
        <MapPin className="size-5 text-primary" />
        {latest ? (
          <div className="min-w-0 flex-1">
            <p className="font-medium">
              {MODES[latest.mode as TransitMode].emoji}{" "}
              {MODES[latest.mode as TransitMode].label} — {latest.distanceKm.toFixed(1)} km
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(latest.occurredAt).toLocaleString()} ·{" "}
              {latest.verified ? "verified" : "unverified"} ·{" "}
              {latest.path.length >= 2
                ? `drawn from ${latest.pingCount} recorded GPS pings`
                : "no GPS trace — route approximated on real streets"}

            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No journeys yet — log one and it will appear here.
          </p>
        )}
      </section>
    </AppShell>
  );
}
