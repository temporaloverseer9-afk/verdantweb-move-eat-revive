import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapTrip = {
  id: string;
  mode: string;
  distanceKm: number;
  verified: boolean;
  points: number;
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

/** Builds an approximate route of the right length around the given origin. */
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

    if (trip) {
      const route = buildRoute(center, trip.distanceKm, trip.id);
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
    } else {
      map.setView(center, 14);
    }

    return () => {
      layers.forEach((l) => l.remove());
    };
  }, [center[0], center[1], trip?.id]);

  return <div ref={nodeRef} className="h-[420px] w-full rounded-xl" />;
}
