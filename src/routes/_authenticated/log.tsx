import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, ShieldAlert, Trash2, Radar } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { getMe, getTrips, logTrip, deleteTrip } from "@/lib/eco.functions";
import { MODES, scoreTrip, type TransitMode } from "@/lib/eco";

export const Route = createFileRoute("/_authenticated/log")({
  head: () => ({
    meta: [
      { title: "Daily log — EcoMove" },
      { name: "description", content: "Every trip you've taken, its verified transit mode, distance and the green points it earned." },
      { property: "og:title", content: "Daily log — EcoMove" },
      { property: "og:description", content: "Review verified trips and the points each one earned." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LogPage;
});

function LogPage() {
  return null;
}
