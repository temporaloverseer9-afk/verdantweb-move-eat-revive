import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Clock, MapPin, Leaf, ExternalLink, Wallet } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getMe } from "@/lib/eco.functions";
import {
  DESTINATIONS,
  TRAVEL_MODES,
  baselineEmissionsKg,
  tripEmissionsKg,
  routeSummary,
  formatCost,
  type TravelScope,
} from "@/lib/travel";
import { TRAVEL_IMAGES, googleMapsUrl } from "@/lib/travel-images";

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

  const places = useMemo(
    () =>
      DESTINATIONS.filter((d) => d.scope === scope).sort((a, b) => a.distanceKm - b.distanceKm),
    [scope],
  );

  const selected = useMemo(
    () => places.find((d) => d.id === selectedId) ?? null,
    [places, selectedId],
  );
  const summary = useMemo(() => (selected ? routeSummary(selected) : null), [selected]);

  useEffect(() => {
    if (selectedId) cardRefs.current[selectedId]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selectedId]);


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
      {selected ? (
        <section className="surface-card mt-3 p-5" aria-live="polite">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold">{selected.name} route summary</h2>
              <p className="text-xs text-muted-foreground">
                {summary!.totalKm.toFixed(1)} km total · vs {summary!.baselineLabel} · avg fare{" "}
                {formatCost(selected.costSgd)}
              </p>

            </div>
            <div className="rounded-xl bg-primary/10 px-4 py-2 text-right">
              <p className="text-[11px] font-medium uppercase tracking-wide text-primary">
                Total CO₂e saved
              </p>
              <p className="font-display text-xl font-bold text-primary">
                {kg(summary!.savedKg)}{" "}
                <span className="text-xs font-medium">({summary!.savedPct}% less)</span>
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {summary!.legs.map((leg) => (
              <li
                key={leg.label}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span aria-hidden>{TRAVEL_MODES[leg.mode].emoji}</span>
                  <span className="font-medium">{leg.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {TRAVEL_MODES[leg.mode].label}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {leg.distanceKm.toFixed(1)} km ·{" "}
                  <span className="font-semibold text-foreground">{kg(leg.emissionsKg)} CO₂e</span>
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-3 text-xs text-muted-foreground">
            Route total {kg(summary!.totalKg)} CO₂e · same distance by {summary!.baselineLabel} would
            emit {kg(summary!.baselineKg)}.
          </p>

          {(() => {
            const cc = costComparison(selected);
            if (!cc)
              return (
                <p className="mt-3 rounded-xl border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                  No driving comparison — {selected.name} is only reachable by sea.
                </p>
              );
            return (
              <div className="mt-4 rounded-xl border border-border p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Cost vs driving yourself
                </p>
                <div className="mt-2 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Eco fare</p>
                    <p className="font-display font-semibold text-primary">{formatCost(cc.eco)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Private car (fuel, tolls, parking)</p>
                    <p className="font-display font-semibold">{formatCost(cc.car)}</p>
                  </div>
                  {cc.rideHail ? (
                    <div>
                      <p className="text-xs text-muted-foreground">Taxi / ride-hail</p>
                      <p className="font-display font-semibold">{formatCost(cc.rideHail)}</p>
                    </div>
                  ) : null}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  You keep roughly{" "}
                  <span className="font-semibold text-primary">
                    S${cc.savedMid.toFixed(2)} ({cc.savedPct}% cheaper)
                  </span>{" "}
                  one-way versus driving
                  {cc.rideHailSavedMid !== null
                    ? `, or about S$${cc.rideHailSavedMid.toFixed(2)} versus a taxi`
                    : ""}
                  .
                </p>
              </div>
            );
          })()}
        </section>

      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Each pin is a destination; the line shows the suggested low-carbon route and mode from its
          departure point. Tap a pin or a card to see per-leg emissions and total CO₂e saved.
        </p>
      )}


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
              <img
                src={TRAVEL_IMAGES[d.id]}
                alt={`${d.name}, ${d.country}`}
                loading="lazy"
                width={768}
                height={512}
                className="mb-4 h-44 w-full rounded-xl object-cover sm:h-52"
              />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold">
                    <a
                      href={googleMapsUrl(d.name, d.country)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                    >
                      {d.name}
                      <ExternalLink className="size-3.5" aria-hidden />
                      <span className="sr-only">— view on Google Maps</span>
                    </a>
                    <span className="ml-2 text-sm font-normal text-muted-foreground">{d.country}</span>
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{d.blurb}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {mode.emoji} {mode.label}
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
                <Fact icon={<MapPin className="size-3.5" />} label="Distance">
                  {d.distanceKm} km
                </Fact>
                <Fact icon={<Clock className="size-3.5" />} label="Journey">
                  {d.travelTime}
                </Fact>
                <Fact icon={<Wallet className="size-3.5" />} label="Avg cost">
                  {formatCost(d.costSgd)}
                </Fact>
                <Fact icon={<Leaf className="size-3.5" />} label="Est. CO₂e">
                  {kg(emitted)}
                </Fact>
                <Fact icon={<Leaf className="size-3.5" />} label="Saved">
                  {kg(saved)} vs {d.scope === "international" ? "flying" : "driving"}
                </Fact>
              </dl>

              <p className="mt-3 text-xs text-muted-foreground">
                Depart from {d.from} · typical one-way fare {formatCost(d.costSgd)} per person
              </p>


              <ul className="mt-3 flex flex-wrap gap-2">
                {d.highlights.map((h) => (
                  <li key={h}>
                    <a
                      href={googleMapsUrl(h, `${d.name}, ${d.country}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Open ${h} near ${d.name} in Google Maps`}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      {h}
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
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
