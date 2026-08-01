import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Footprints, Bike, Bus, Car } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import BrandLogo from "@/components/BrandLogo";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VerdantWeb — Earn green points for how you travel" },
      {
        name: "description",
        content:
          "VerdantWeb turns walking, cycling and public transit into green points. Log trips, track your daily eco-score and climb the weekly leaderboard.",
      },
      { property: "og:title", content: "VerdantWeb — Earn green points for how you travel" },
      {
        property: "og:description",
        content:
          "Verified walking, cycling and transit trips earn points. Private car trips cost you. Track your eco-score daily.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://verdantweb-move-eat-revive.lovable.app/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://verdantweb-move-eat-revive.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              name: "VerdantWeb",
              url: "https://verdantweb-move-eat-revive.lovable.app/",
              description:
                "VerdantWeb tracks walking, cycling and transit trips plus food choices, scoring them as green points on a daily eco-scoreboard and weekly leaderboard.",
            },
            {
              "@type": "Organization",
              name: "VerdantWeb",
              url: "https://verdantweb-move-eat-revive.lovable.app/",
              logo: "https://verdantweb-move-eat-revive.lovable.app/verdantweb-logo.png",
            },
          ],
        }),
      },
    ],
  }),
  component: Landing,
});


const rules = [
  { icon: Footprints, title: "Walking", detail: "2–8 km/h · step counter verified", points: "+5 / km" },
  { icon: Bike, title: "Cycling", detail: "10–25 km/h · accelerometer verified", points: "+3 / km" },
  { icon: Bus, title: "Bus & train", detail: "Route matched to transit lines", points: "+2 / km" },
  { icon: Car, title: "Private car", detail: "Logged honestly · reduced penalty", points: "−0.5 / km" },
];

function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) navigate({ to: "/dashboard", replace: true });
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate({ to: "/dashboard", replace: true });
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="flex items-center justify-between gap-2">
          <BrandLogo size={48} className="size-12 rounded-2xl shadow-lift" />

          <ThemeToggle />
        </div>
        <h1 className="mt-6 text-4xl font-bold sm:text-5xl">
          Every kilometre you move counts.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          EcoMove scores your daily travel. Verified human-powered and public transit trips earn
          green points — private car trips cost you. Track a live eco-scoreboard and race your
          friends every week.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/auth">Start earning points</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/auth">I already have an account</Link>
          </Button>

        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2">
          {rules.map(({ icon: Icon, title, detail, points }) => (
            <div key={title} className="surface-card flex items-center gap-4 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display font-semibold">{title}</p>
                <p className="truncate text-sm text-muted-foreground">{detail}</p>
              </div>
              <span className="font-display text-sm font-bold whitespace-nowrap">{points}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
