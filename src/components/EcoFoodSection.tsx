import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Loader2, Salad, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { analyzeFoodPhoto, deleteFood, getFoodLogs, logFood } from "@/lib/food.functions";
import { FOOD_TIERS, TIER_ORDER, type FoodTier } from "@/lib/food";

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the photo"));
    reader.readAsDataURL(file);
  });
}

export function EcoFoodSection() {
  const queryClient = useQueryClient();
  const analyze = useServerFn(analyzeFoodPhoto);
  const create = useServerFn(logFood);
  const remove = useServerFn(deleteFood);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const foodQuery = useQuery({ queryKey: ["food"], queryFn: () => getFoodLogs({}) });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["food"] });
    queryClient.invalidateQueries({ queryKey: ["me"] });
    queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      invalidate();
      toast.success("Meal removed");
    },
  });

  async function onPhoto(file: File) {
    setBusy(true);
    try {
      const image = await readAsDataUrl(file);
      setPreview(image);
      const result = await analyze({ data: { image } });
      const saved = await create({
        data: {
          label: result.label,
          tier: result.tier,
          ...(result.note ? { note: result.note } : {}),
        },
      });
      invalidate();
      toast.success(
        `${saved.label} — tier ${saved.tier} · ${saved.points > 0 ? "+" : ""}${saved.points} points`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not judge that meal");
    } finally {
      setBusy(false);
    }
  }

  const list = foodQuery.data ?? [];
  const todayPoints = list
    .filter((f) => new Date(f.occurredAt).toDateString() === new Date().toDateString())
    .reduce((s, f) => s + f.points, 0);

  return (
    <section className="mt-10">
      <div className="flex items-center gap-3">
        <span className="gradient-eco flex size-10 items-center justify-center rounded-xl text-primary-foreground shadow-lift">
          <Salad className="size-5" />
        </span>
        <div>
          <h2 className="font-display text-xl font-bold">Eco Food</h2>
          <p className="text-sm text-muted-foreground">
            Snap your meal — the farther down the food triangle it sits, the more points it earns.
          </p>
        </div>
      </div>

      <div className="surface-card mt-4 space-y-2 p-5">
        {TIER_ORDER.map((tier, i) => {
          const t = FOOD_TIERS[tier as FoodTier];
          const width = 46 + i * 18;
          return (
            <div key={tier} className="flex justify-center">
              <div
                style={{ width: `${width}%` }}
                className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-muted px-3 py-2"
              >
                <span className="text-lg">{t.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{t.examples}</p>
                </div>
                <span
                  className={`font-display text-sm font-bold tabular-nums ${
                    t.points >= 0 ? "text-primary" : "text-destructive"
                  }`}
                >
                  {t.points > 0 ? "+" : ""}
                  {t.points}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="surface-card mt-4 flex flex-wrap items-center justify-between gap-3 p-5">
        <div className="flex items-center gap-3">
          {preview ? (
            <img
              src={preview}
              alt="Last meal you photographed"
              className="size-14 rounded-xl object-cover"
            />
          ) : null}
          <div className="text-sm">
            <p className="font-medium">Judge a meal with your camera</p>
            <p className="text-muted-foreground tabular-nums">Food points today: {todayPoints}</p>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void onPhoto(file);
          }}
        />
        <Button onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
          {busy ? "Judging…" : "Take food photo"}
        </Button>
      </div>

      <ul className="mt-4 max-h-96 space-y-2 overflow-y-auto pr-1">
        {list.length === 0 && !foodQuery.isLoading && (
          <p className="text-sm text-muted-foreground">No meals logged yet.</p>
        )}
        {list.map((f) => (
          <li key={f.id} className="surface-card flex items-center gap-3 p-4">
            <span className="text-2xl">{FOOD_TIERS[f.tier].emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{f.label}</p>
              <p className="truncate text-xs text-muted-foreground">
                {FOOD_TIERS[f.tier].label}
                {f.note ? ` · ${f.note}` : ""}
              </p>
            </div>
            <span
              className={`font-display text-lg font-bold tabular-nums ${
                f.points >= 0 ? "text-primary" : "text-destructive"
              }`}
            >
              {f.points > 0 ? "+" : ""}
              {f.points}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete meal"
              onClick={() => deleteMutation.mutate(f.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
