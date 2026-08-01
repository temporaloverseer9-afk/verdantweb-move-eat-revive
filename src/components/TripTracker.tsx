import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LocateFixed, Play, ShieldCheck, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { logTrackedTrip } from "@/lib/eco.functions";
import { MODES, type TransitMode } from "@/lib/eco";
import {
  MAX_ACCURACY_M,
  MIN_DURATION_S,
  PING_INTERVAL_MS,
  formatDuration,
  statsFromPath,
  type Ping,
} from "@/lib/track";

const MODE_KEYS = ["walk", "cycle", "bus", "train", "car"] as const;

type Permission = "unknown" | "granted" | "denied";

export function TripTracker() {
  const queryClient = useQueryClient();
  const submit = useServerFn(logTrackedTrip);

  const [permission, setPermission] = useState<Permission>("unknown");
  const [mode, setMode] = useState<TransitMode>("walk");
  const [tracking, setTracking] = useState(false);
  const [path, setPath] = useState<Ping[]>([]);
  const [live, setLive] = useState<Ping | null>(null);
  const [tick, setTick] = useState(0);

  const watchId = useRef<number | null>(null);
  const lastSample = useRef(0);

  const stopWatch = useCallback(() => {
    if (watchId.current !== null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  // Location is mandatory: ask for it as soon as the screen opens.
  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setPermission("denied");
      return;
    }

    const onFix = (pos: GeolocationPosition) => {
      setPermission("granted");
      setLive({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        t: pos.timestamp,
        acc: pos.coords.accuracy,
      });
    };

    const attempt = (highAccuracy: boolean) => {
      navigator.geolocation.getCurrentPosition(onFix, (err) => {
        // Only an explicit browser denial means "denied". Timeouts and
        // temporary "position unavailable" errors are common indoors and on
        // first fix — retry with a coarse fix instead of locking the UI.
        if (err.code === err.PERMISSION_DENIED) {
          setPermission("denied");
          return;
        }
        if (highAccuracy) {
          attempt(false);
          return;
        }
        setPermission("granted");
      }, { enableHighAccuracy: highAccuracy, timeout: highAccuracy ? 20000 : 30000, maximumAge: highAccuracy ? 0 : 60000 });
    };

    // Trust an already-granted permission immediately so a slow fix never
    // shows the "access required" screen.
    const perms = (navigator as Navigator & { permissions?: Permissions }).permissions;
    if (perms?.query) {
      perms
        .query({ name: "geolocation" as PermissionName })
        .then((status) => {
          if (status.state === "granted") setPermission("granted");
          if (status.state === "denied") setPermission("denied");
        })
        .catch(() => undefined);
    }

    attempt(true);
  }, []);

  useEffect(() => {
    requestLocation();
    return stopWatch;
  }, [requestLocation, stopWatch]);

  // Live elapsed-time readout while tracking.
  useEffect(() => {
    if (!tracking) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [tracking]);

  const mutation = useMutation({
    mutationFn: (vars: { mode: TransitMode; path: Ping[] }) => submit({ data: vars }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      setPath([]);
      toast.success(
        res.verified
          ? `Verified ${res.distanceKm.toFixed(2)} km — ${res.points > 0 ? "+" : ""}${res.points} points`
          : `Verification failed — ${res.points} points`,
      );
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save trip"),
  });

  function start() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setPath([]);
    lastSample.current = 0;
    setTracking(true);
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const ping: Ping = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          t: pos.timestamp,
          acc: pos.coords.accuracy,
        };
        setLive(ping);
        setPermission("granted");
        if (ping.acc > MAX_ACCURACY_M) return;
        // GPS ping every 45 seconds, as specified.
        if (ping.t - lastSample.current < PING_INTERVAL_MS - 1000) return;
        lastSample.current = ping.t;
        setPath((prev) => [...prev, ping]);
      },
      (err) => {
        setTracking(false);
        stopWatch();
        setPermission(err.code === err.PERMISSION_DENIED ? "denied" : permission);
        toast.error("Location lost — tracking stopped");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 },
    );
  }

  function stop() {
    stopWatch();
    setTracking(false);
    const finalPath = live && (path.length === 0 || live.t > path[path.length - 1]!.t)
      ? [...path, live]
      : path;
    if (finalPath.length < 3) {
      toast.error("Not enough GPS samples yet — keep tracking for at least a minute");
      setPath([]);
      return;
    }
    mutation.mutate({ mode, path: finalPath });
  }

  const stats = statsFromPath(path);
  const elapsed = tracking && path.length > 0 ? (Date.now() - path[0]!.t) / 1000 : stats.durationS;
  void tick;

  if (permission === "denied") {
    return (
      <section className="surface-card mt-5 p-6 text-center">
        <LocateFixed className="mx-auto size-8 text-destructive" />
        <h2 className="font-display mt-3 text-base font-semibold">Location access required</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Trips are only counted when they are recorded live from your device's GPS. Enable location
          for this site in your browser settings, then try again.
        </p>
        <Button className="mt-4" onClick={requestLocation}>
          Enable location
        </Button>
      </section>
    );
  }

  return (
    <section className="surface-card mt-5 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-semibold">Track a trip</h2>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" /> GPS verified
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {MODE_KEYS.map((m) => (
          <button
            key={m}
            type="button"
            disabled={tracking}
            onClick={() => setMode(m)}
            className={`rounded-xl border p-3 text-center text-sm transition-colors disabled:opacity-50 ${
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

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-muted p-4 sm:grid-cols-4">
        <Readout label="Distance" value={`${stats.distanceKm.toFixed(2)} km`} />
        <Readout label="Elapsed" value={formatDuration(elapsed)} />
        <Readout label="Avg speed" value={`${stats.avgSpeedKmh.toFixed(1)} km/h`} />
        <Readout label="GPS pings" value={String(stats.pings)} />
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {tracking
          ? `Recording — a GPS ping is taken every 45s. Keep this screen open for at least ${MIN_DURATION_S}s.`
          : live
            ? `Ready — current accuracy ±${Math.round(live.acc)} m. Distance, speed and points are calculated on the server from your trace.`
            : "Waiting for a GPS fix…"}
      </p>

      {tracking ? (
        <Button className="mt-4 w-full" variant="destructive" onClick={stop}>
          <Square className="size-4" /> Stop & save trip
        </Button>
      ) : (
        <Button
          className="mt-4 w-full"
          onClick={start}
          disabled={mutation.isPending || permission !== "granted"}
        >
          <Play className="size-4" /> {mutation.isPending ? "Saving…" : "Start tracking"}
        </Button>
      )}
    </section>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}
