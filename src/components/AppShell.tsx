import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, ScrollText, Trophy, LogOut, Map, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

const tabs = [
  { to: "/dashboard", label: "Scoreboard", icon: LayoutDashboard },
  { to: "/log", label: "Daily log", icon: ScrollText },
  { to: "/map", label: "Map", icon: Map },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell({
  children,
  username,
}: {
  children: React.ReactNode;
  username?: string | null | undefined;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img
              src="/verdantweb-logo.png"
              alt="VerdantWeb"
              width={36}
              height={36}
              className="size-9 rounded-xl object-cover"
            />
            <span className="leading-tight">
              <span className="block font-display text-lg font-bold">VerdantWeb</span>
              <span className="block text-[11px] text-muted-foreground">EcoMove · Eco Food</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {username ? (
              <span className="hidden text-sm text-muted-foreground sm:inline">@{username}</span>
            ) : null}
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="size-4" />
              <span className="sr-only sm:not-sr-only">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl">
          {tabs.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium text-muted-foreground transition-colors data-[status=active]:text-primary"
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
