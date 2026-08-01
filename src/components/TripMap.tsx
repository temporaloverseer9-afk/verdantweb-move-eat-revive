import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapTrip = {
  id: string;
  mode: string;
  distanceKm: number;
  verified: boolean;
  points: number;
  /** Real recorded GPS trace, when the trip was tracked live. */
  path?: [number, number][];
};


/** Deterministic pseudo-random generator so a trip always draws the same shape. */
function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Builds an approximate off-road fallback shape if road routing is unavailable. */
function buildRoute(origin: [number, number], distanceKm: number, seed: string) {
  const rand = seeded(seed);
  const steps = 24;
  const stepKm = distanceKm / steps;
  const points: [number, number][] = [origin];
  let heading = rand() * Math.PI * 2;
  let [lat, lng] = origin;
  for (let i = 0; i < steps; i++) {
    heading += (rand() - 0.5) * 0.7;
    const dLat = (stepKm / 111) * Math.cos(heading);
    const dLng = (stepKm / (111 * Math.cos((lat * Math.PI) / 180))) * Math.sin(heading);
    lat += dLat;
    lng += dLng;
    points.push([lat, lng]);
  }
  return points;
}

function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Cuts a polyline so its total length equals the target distance. */
function trimToDistance(points: [number, number][], targetKm: number) {
  const out: [number, number][] = [points[0]!];
  let acc = 0;
  for (let i = 1; i < points.length; i++) {
    const seg = haversineKm(points[i - 1]!, points[i]!);
    if (acc + seg >= targetKm) {
      const f = seg === 0 ? 0 : (targetKm - acc) / seg;
      out.push([
        points[i - 1]![0] + (points[i]![0] - points[i - 1]![0]) * f,
        points[i - 1]![1] + (points[i]![1] - points[i - 1]![1]) * f,
      ]);
      return out;
    }
    acc += seg;
    out.push(points[i]!);
  }
  return out;
}

function offset(origin: [number, number], km: number, heading: number): [number, number] {
  const lat = origin[0] + (km / 111) * Math.cos(heading);
  const lng =
    origin[1] + (km / (111 * Math.cos((origin[0] * Math.PI) / 180))) * Math.sin(heading);
  return [lat, lng];
}

/**
 * Snaps the journey to the real street/path network via OSRM, so the line follows
 * roads and park paths instead of cutting through private homes.
 */
async function buildRoadRoute(
  origin: [number, number],
  distanceKm: number,
  seed: string,
  signal: AbortSignal,
): Promise<[number, number][] | null> {
  const rand = seeded(seed);
  const heading = rand() * Math.PI * 2;

  for (const factor of [0.62, 0.8, 1.0, 1.3]) {
    const dest = offset(origin, distanceKm * factor, heading);
    const via = offset(origin, distanceKm * factor * 0.55, heading + (rand() - 0.5) * 1.2);
    const coords = `${origin[1]},${origin[0]};${via[1]},${via[0]};${dest[1]},${dest[0]}`;
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`,
        { signal },
      );
      if (!res.ok) continue;
      const data = (await res.json()) as {
        code: string;
        routes?: { distance: number; geometry: { coordinates: [number, number][] } }[];
      };
      const route = data.routes?.[0];
      if (data.code !== "Ok" || !route) continue;
      const line = route.geometry.coordinates.map(
        ([lng, lat]) => [lat, lng] as [number, number],
      );
      if (route.distance / 1000 >= distanceKm * 0.98) {
        return trimToDistance(line, distanceKm);
      }
      if (factor === 1.3) return line;
    } catch {
      return null;
    }
  }
  return null;
}


export default function TripMap({
  center,
  trip,
}: {
  center: [number, number];
  trip: MapTrip | null;
}) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!nodeRef.current || mapRef.current) return;
    const map = L.map(nodeRef.current, { attributionControl: true }).setView(center, 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const layers: L.Layer[] = [];

    layers.push(
      L.circleMarker(center, {
        radius: 8,
        color: "hsl(var(--ring))",
        weight: 3,
        fillColor: "#16a34a",
        fillOpacity: 1,
      })
        .addTo(map)
        .bindTooltip("You are here"),
    );

    const controller = new AbortController();

    if (trip) {
      const draw = (route: [number, number][]) => {
        if (controller.signal.aborted || !mapRef.current) return;
        const line = L.polyline(route, {
          color: trip.points >= 0 ? "#16a34a" : "#dc2626",
          weight: 5,
          opacity: 0.85,
        }).addTo(map);
        layers.push(line);
        layers.push(
          L.circleMarker(route[route.length - 1]!, {
            radius: 7,
            color: "#ffffff",
            weight: 3,
            fillColor: trip.points >= 0 ? "#16a34a" : "#dc2626",
            fillOpacity: 1,
          })
            .addTo(map)
            .bindTooltip("Trip end"),
        );
        map.fitBounds(line.getBounds().pad(0.25));
      };

      buildRoadRoute(center, trip.distanceKm, trip.id, controller.signal)
        .then((road) => draw(road ?? buildRoute(center, trip.distanceKm, trip.id)))
        .catch(() => draw(buildRoute(center, trip.distanceKm, trip.id)));
    } else {
      map.setView(center, 14);
    }

    return () => {
      controller.abort();
      layers.forEach((l) => l.remove());
    };
  }, [center[0], center[1], trip?.id]);


  return <div ref={nodeRef} className="h-[420px] w-full rounded-xl" />;
}
