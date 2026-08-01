import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  DEPARTURE_COORDS,
  DESTINATION_COORDS,
  MODE_ROUTE_STYLE,
  TRAVEL_MODES,
  tripEmissionsKg,
  type Destination,
} from "@/lib/travel";

/** Gentle great-circle-ish arc so overlapping routes stay readable. */
function arc(a: [number, number], b: [number, number], bend = 0.18) {
  const pts: [number, number][] = [];
  const mid: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const ctrl: [number, number] = [mid[0] - dy * bend, mid[1] + dx * bend];
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push([
      u * u * a[0] + 2 * u * t * ctrl[0] + t * t * b[0],
      u * u * a[1] + 2 * u * t * ctrl[1] + t * t * b[1],
    ]);
  }
  return pts;
}

export default function TravelMap({
  places,
  selectedId,
  onSelect,
}: {
  places: Destination[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  useEffect(() => {
    if (!nodeRef.current || mapRef.current) return;
    const map = L.map(nodeRef.current, { scrollWheelZoom: false }).setView([1.35, 103.82], 10);
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
    const bounds = L.latLngBounds([]);

    for (const d of places) {
      const from = DEPARTURE_COORDS[d.id];
      const to = DESTINATION_COORDS[d.id];
      if (!from || !to) continue;
      const mode = TRAVEL_MODES[d.mode];
      const style = MODE_ROUTE_STYLE[d.mode];
      const active = selectedId === d.id;

      const line = L.polyline(arc(from, to), {
        color: style.color,
        weight: active ? 6 : 3,
        opacity: active ? 0.95 : 0.55,
        dashArray: style.dash,
      })
        .addTo(map)
        .bindTooltip(`${mode.emoji} ${mode.label} · ${d.distanceKm} km`);
      line.on("click", () => selectRef.current(d.id));
      layers.push(line);

      layers.push(
        L.circleMarker(from, {
          radius: 4,
          color: style.color,
          weight: 2,
          fillColor: "#ffffff",
          fillOpacity: 1,
        })
          .addTo(map)
          .bindTooltip(`Depart: ${d.from}`),
      );

      const pin = L.marker(to, {
        icon: L.divIcon({
          className: "",
          html: `<div style="display:flex;align-items:center;justify-content:center;width:${
            active ? 38 : 30
          }px;height:${active ? 38 : 30}px;border-radius:9999px;background:${style.color};color:#fff;font-size:${
            active ? 18 : 15
          }px;box-shadow:0 2px 6px rgba(0,0,0,.35);border:2px solid #fff">${mode.emoji}</div>`,
          iconSize: [active ? 38 : 30, active ? 38 : 30],
          iconAnchor: [active ? 19 : 15, active ? 19 : 15],
        }),
      })
        .addTo(map)
        .bindPopup(
          `<strong>${d.name}</strong><br/>${mode.emoji} ${mode.label} · ${d.distanceKm} km<br/>${
            d.travelTime
          }<br/>≈ ${tripEmissionsKg(d).toFixed(1)} kg CO₂e`,
        );
      pin.on("click", () => selectRef.current(d.id));
      layers.push(pin);

      bounds.extend(from).extend(to);
    }

    if (bounds.isValid()) map.fitBounds(bounds.pad(0.15));

    return () => {
      for (const l of layers) l.remove();
    };
  }, [places, selectedId]);

  return <div ref={nodeRef} className="h-[440px] w-full rounded-xl" aria-label="Map of eco travel destinations" />;
}
