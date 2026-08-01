import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Cloud, Leaf, TreePine, Gauge } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getMe, getTrips } from "@/lib/eco.functions";
import { MODES } from "@/lib/eco";
import {
  EMISSION_FACTORS,
  CAR_BASELINE,
  RANGES,
  computeFootprint,
  filterByRange,
  type RangeKey,
} from "@/lib/carbon";

export const Route = createFileRoute("/_authenticated/footprint")({
  head: () => ({
    meta: [
      { title: "Carbon footprint calculator — VerdantWeb" },
      {
        name: "description",
        content:
          "Estimate the CO2e of your verified journeys by distance and transit mode, and see how much you saved versus driving.",
      },
      { property: "og:title", content: "Carbon footprint calculator — VerdantWeb" },
      {
        property: "og:description",
        content: "Your travel emissions, calculated from GPS-verified trip distance and mode.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FootprintPage,
});

const kg = (n: number) => `${n.toFixed(n < 10 ? 2 : 1)} kg`;

function FootprintPage() {
  const me = useServerFn(getMe);
  const trips = useServerFn(getTrips);
  const profileQuery = useQuery({ queryKey: ["me"], queryFn: () => me({}) });
  const tripsQuery = useQuery({ queryKey: ["trips"], queryFn: () => trips({}) });
  const [range, setRange] = useState<RangeKey>("30d");

  const result = useMemo(
    () => computeFootprint(filterByRange(tripsQuery.data ?? [], range)),
    [tripsQuery.data, range],
  );

  const maxKm = Math.max(1, ...result.byMode.map((m) => m.distanceKm));

  return (
    <AppShell username={profileQuery.data?.username}>
      <h1 className="text-2xl font-bold">Carbon footprint calculator</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Emissions estimated from your GPS-verified trip distance and transit mode. Trips that fail
        verification are costed at the private-car rate.
      </p>

      <div className="mt-4 flex gap-2">
        {RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setRange(r.key)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              range === r.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {tripsQuery.isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Calculating…</p>
      ) : result.totalDistanceKm === 0 ? (
        <p className="mt-6 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          No tracked trips in this period yet. Record a journey on the Daily log tab and your
          footprint will appear here.
        </p>
      ) : (
        <>
          <section className="mt-5 grid gap-3 sm:grid-cols-2">
            <Stat
              icon={<Cloud className="size-4" />}
              label="Estimated emissions"
              value={kg(result.emissionsKg)}
              hint={`${result.totalDistanceKm.toFixed(1)} km travelled`}
            />
            <Stat
              icon={<Leaf className="size-4" />}
              label="Saved vs driving"
              value={kg(Math.max(0, result.savedKg))}
              hint={`Driving it all would emit ${kg(result.baselineKg)}`}
            />
            <Stat
              icon={<Gauge className="size-4" />}
              label="Intensity"
              value={`${Math.round(result.perKmGrams)} g/km`}
              hint={`Private car baseline is ${CAR_BASELINE} g/km`}
            />
            <Stat
              icon={<TreePine className="size-4" />}
              label="Tree-years offset"
              value={Math.max(0, result.treeYears).toFixed(2)}
              hint="One tree absorbs ~21 kg CO2e a year"
            />
          </section>

          <section className="mt-6 rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-semibold">Breakdown by mode</h2>
            <ul className="mt-4 space-y-4">
              {result.byMode.map((m) => (
                <li key={m.mode}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium">
                      {MODES[m.mode].emoji} {MODES[m.mode].label}
                    </span>
                    <span className="text-muted-foreground">
                      {m.distanceKm.toFixed(1)} km · {m.trips} trip{m.trips === 1 ? "" : "s"} ·{" "}
                      {kg(m.emissionsKg)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(m.distanceKm / maxKm) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <section className="mt-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-lg font-semibold">Emission factors used</h2>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {(Object.keys(EMISSION_FACTORS) as (keyof typeof EMISSION_FACTORS)[]).map((mode) => (
            <li key={mode} className="flex items-center justify-between gap-2">
              <span>
                {MODES[mode].emoji} {MODES[mode].label}
              </span>
              <span className="text-muted-foreground">{EMISSION_FACTORS[mode]} g CO2e / km</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Average passenger well-to-wheel factors (DEFRA / EEA). Estimates only.
        </p>
      </section>
    </AppShell>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 font-display text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
