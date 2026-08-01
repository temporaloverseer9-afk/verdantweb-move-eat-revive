import { useMemo } from "react";
import { computeBadges, type ProfileStats } from "@/lib/profile";

export function BadgeGrid({ stats }: { stats: ProfileStats }) {
  const badges = useMemo(() => computeBadges(stats), [stats]);
  const unlocked = badges.filter((b) => b.unlocked);
  const locked = badges.filter((b) => !b.unlocked);

  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-bold">Badges</h2>
        <span className="text-xs text-muted-foreground">
          {unlocked.length} of {badges.length} earned
        </span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {[...unlocked, ...locked].map((b) => (
          <div
            key={b.id}
            className={`surface-card flex items-center gap-3 p-4 ${
              b.unlocked ? "border-primary/40" : "opacity-70"
            }`}
          >
            <span
              className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-2xl ${
                b.unlocked ? "gradient-eco" : "bg-muted grayscale"
              }`}
              aria-hidden
            >
              {b.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {b.name}
                {b.unlocked && <span className="ml-2 text-xs text-primary">earned</span>}
              </p>
              <p className="truncate text-xs text-muted-foreground">{b.description}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.round(b.progress * 100)}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground tabular-nums">
                {b.progressLabel}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
