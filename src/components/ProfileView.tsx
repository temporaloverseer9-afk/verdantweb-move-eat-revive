import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { BadgeGrid } from "@/components/BadgeGrid";
import { AVATAR_CHOICES, type ProfileStats } from "@/lib/profile";
import { getProfileStats, updateProfile } from "@/lib/profile.functions";

export function ProfileView({ userId }: { userId?: string }) {
  const queryClient = useQueryClient();
  const fetchStats = useServerFn(getProfileStats);
  const saveAvatar = useServerFn(updateProfile);

  const meQuery = useQuery({
    queryKey: ["profile-stats", "me"],
    queryFn: () => fetchStats({ data: {} }),
  });

  const isSelf = !userId || userId === meQuery.data?.userId;

  const otherQuery = useQuery({
    queryKey: ["profile-stats", userId],
    queryFn: () => fetchStats({ data: { userId: userId! } }),
    enabled: !!userId,
  });

  const stats: ProfileStats | null | undefined = userId ? otherQuery.data : meQuery.data;

  const avatarMutation = useMutation({
    mutationFn: (avatar: string) => saveAvatar({ data: { avatar } }),
    onSuccess: () => {
      toast.success("Avatar updated");
      queryClient.invalidateQueries({ queryKey: ["profile-stats"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const loading = userId ? otherQuery.isLoading : meQuery.isLoading;

  return (
    <AppShell username={meQuery.data?.username}>
      {loading && <p className="text-sm text-muted-foreground">Loading profile…</p>}
      {!loading && !stats && <p className="text-sm text-muted-foreground">Profile not found.</p>}

      {stats && (
        <>
          <header className="surface-card flex flex-wrap items-center gap-4 p-5">
            <span
              className="gradient-eco flex size-20 items-center justify-center rounded-2xl text-4xl shadow-lift"
              aria-hidden
            >
              {stats.avatar}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="font-display truncate text-2xl font-bold">@{stats.username}</h1>
              <p className="text-sm text-muted-foreground">
                {isSelf ? "Your VerdantWeb profile" : "VerdantWeb member"} · joined{" "}
                {new Date(stats.joinedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-3xl font-bold text-primary tabular-nums">
                {stats.totalPoints}
              </p>
              <p className="text-xs text-muted-foreground">all-time points</p>
            </div>
          </header>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Green km" value={stats.greenKm.toFixed(1)} />
            <Stat label="This week" value={String(stats.weeklyPoints)} />
            <Stat label="Food points" value={String(stats.foodPoints)} />
            <Stat label="Trips" value={String(stats.tripCount)} />
          </div>

          {isSelf && (
            <section className="mt-8">
              <h2 className="font-display text-lg font-bold">Pick your animal</h2>
              <p className="text-sm text-muted-foreground">Choose a friendly animal avatar.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {AVATAR_CHOICES.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => avatarMutation.mutate(a)}
                    disabled={avatarMutation.isPending}
                    aria-label={`Choose ${a} avatar`}
                    className={`flex size-12 items-center justify-center rounded-xl border text-2xl transition-colors hover:bg-accent/20 ${
                      stats.avatar === a ? "border-primary ring-2 ring-primary/30" : "border-border"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </section>
          )}

          <BadgeGrid stats={stats} />
        </>
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card p-4">
      <p className="font-display text-xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
