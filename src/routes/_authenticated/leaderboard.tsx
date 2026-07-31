import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Crown } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getMe, getLeaderboard } from "@/lib/eco.functions";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({
    meta: [
      { title: "Weekly leaderboard — EcoMove" },
      {
        name: "description",
        content:
          "See how your weekly green points stack up against other EcoMove movers in your community.",
      },
      { property: "og:title", content: "Weekly leaderboard — EcoMove" },
      { property: "og:description", content: "Rankings by weekly green points earned from verified trips." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeaderboardPage,
});

const medal = ["🥇", "🥈", "🥉"];

function LeaderboardPage() {
  const me = useServerFn(getMe);
  const board = useServerFn(getLeaderboard);
  const profileQuery = useQuery({ queryKey: ["me"], queryFn: () => me({}) });
  const boardQuery = useQuery({ queryKey: ["leaderboard"], queryFn: () => board({}) });

  const rows = boardQuery.data ?? [];
  const myId = profileQuery.data?.id;
  const myRank = rows.findIndex((r) => r.userId === myId) + 1;

  return (
    <AppShell username={profileQuery.data?.username}>
      <h1 className="text-2xl font-bold">Weekly leaderboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Points reset into a fresh race every Monday. {myRank > 0 ? `You're #${myRank}.` : ""}
      </p>

      {boardQuery.isLoading && (
        <p className="mt-6 text-sm text-muted-foreground">Loading rankings…</p>
      )}

      <ol className="mt-5 space-y-2">
        {rows.map((r, i) => {
          const isMe = r.userId === myId;
          return (
            <li
              key={r.userId}
              className={`surface-card flex items-center gap-4 p-4 ${
                isMe ? "border-primary ring-2 ring-primary/25" : ""
              }`}
            >
              <span className="font-display w-8 shrink-0 text-center text-lg font-bold tabular-nums">
                {i < 3 ? medal[i] : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  @{r.username}
                  {isMe && <span className="ml-2 text-xs text-primary">you</span>}
                </p>
                <p className="text-xs text-muted-foreground">{r.totalPoints} pts all-time</p>
              </div>
              <span className="font-display flex items-center gap-1 text-lg font-bold tabular-nums text-primary">
                {i === 0 && <Crown className="size-4 text-accent" />}
                {r.weeklyPoints}
              </span>
            </li>
          );
        })}
      </ol>

      {!boardQuery.isLoading && rows.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          No movers yet. Log a trip to claim first place.
        </p>
      )}
    </AppShell>
  );
}
