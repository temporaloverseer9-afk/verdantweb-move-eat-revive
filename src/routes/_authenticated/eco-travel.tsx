import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Clock, MapPin, Leaf } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getMe } from "@/lib/eco.functions";
import {
  DESTINATIONS,
  TRAVEL_MODES,
  baselineEmissionsKg,
  tripEmissionsKg,
  type TravelScope,
} from "@/lib/travel";

const TravelMap = lazy(() => import("@/components/TravelMap"));

export const Route = createFileRoute("/_authenticated/eco-travel")({
  head: () => ({
    meta: [
      { title: "Eco travel from Singapore — VerdantWeb" },
      {
        name: "description",
        content:
          "Low-carbon places you can reach from Singapore — Johor Bahru by coach, Batam by ferry, plus local island and park escapes.",
      },
      { property: "og:title", content: "Eco travel from Singapore — VerdantWeb" },
      {
        property: "og:description",
        content: "Switch between international border hops and local Singapore getaways, with CO2e per trip.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EcoTravelPage,
});

const kg = (n: number) => `${n.toFixed(n < 10 ? 1 : 0)} kg`;

function EcoTravelPage() {
  const me = useServerFn(getMe);
  const profileQuery = useQuery({ queryKey: ["me"], queryFn: () => me({}) });
  const [scope, setScope] = useState<TravelScope>("international");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLLIElement | null>>({});

  useEffect(() => {
    setSelectedId(null);
  }, [scope]);

  useEffect(() => {
    if (selectedId) cardRefs.current[selectedId]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selectedId]);

  const places = useMemo(
    () =>
      DESTINATIONS.filter((d) => d.scope === scope).sort((a, b) => a.distanceKm - b.distanceKm),
    [scope],
  );

  return (
    <AppShell username={profileQuery.data?.username}>
      <h1 className="text-2xl font-bold">Eco travel</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Places you can reach from Singapore without flying. Estimates are one-way, per passenger.
      </p>

      <div
        role="tablist"
        aria-label="Destination scope"
        className="mt-4 inline-flex rounded-full border border-border bg-card p-1"
      >
        {(
          [
            { key: "international", label: "International" },
            { key: "local", label: "Local (Singapore)" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.key}
            role="tab"
            aria-selected={scope === opt.key}
            type="button"
            onClick={() => setScope(opt.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              scope === opt.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <section className="surface-card mt-5 overflow-hidden p-2">
        <Suspense
          fallback={
            <div className="flex h-[440px] items-center justify-center text-sm text-muted-foreground">
              Loading map…
            </div>
          }
        >
          <TravelMap places={places} selectedId={selectedId} onSelect={setSelectedId} />
        </Suspense>
      </section>
      <p className="mt-2 text-xs text-muted-foreground">
        Each pin is a destination; the line shows the suggested low-carbon route and mode from its
        departure point. Tap a pin or a card to highlight it.
      </p>

      <ul className="mt-5 space-y-4">
        {places.map((d) => {
          const emitted = tripEmissionsKg(d);
          const baseline = baselineEmissionsKg(d);
          const saved = Math.max(0, baseline - emitted);
          const mode = TRAVEL_MODES[d.mode];
          return (
            <li
              key={d.id}
              ref={(el) => {
                cardRefs.current[d.id] = el;
              }}
              onClick={() => setSelectedId(d.id)}
              className={`cursor-pointer rounded-2xl border bg-card p-5 transition-colors ${
                selectedId === d.id ? "border-primary ring-1 ring-primary/40" : "border-border"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold">
                    {d.name}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">{d.country}</span>
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{d.blurb}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {mode.emoji} {mode.label}
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <Fact icon={<MapPin className="size-3.5" />} label="Distance">
                  {d.distanceKm} km
                </Fact>
                <Fact icon={<Clock className="size-3.5" />} label="Journey">
                  {d.travelTime}
                </Fact>
                <Fact icon={<Leaf className="size-3.5" />} label="Est. CO₂e">
                  {kg(emitted)}
                </Fact>
                <Fact icon={<Leaf className="size-3.5" />} label="Saved">
                  {kg(saved)} vs {d.scope === "international" ? "flying" : "driving"}
                </Fact>
              </dl>

              <p className="mt-3 text-xs text-muted-foreground">Depart from {d.from}</p>

              <ul className="mt-3 flex flex-wrap gap-2">
                {d.highlights.map((h) => (
                  <li
                    key={h}
                    className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {h}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>

      <p className="mt-6 text-xs text-muted-foreground">
        Emission factors: coach 68, ferry 115, bus 105, rail 41, MRT 28 g CO₂e per passenger-km;
        compared against 255 g/km for a short-haul flight and 170 g/km for a private car.
      </p>
    </AppShell>
  );
}

function Fact({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  );
}
