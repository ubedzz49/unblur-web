"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy } from "lucide-react";
import { NAV, isActive, MobileTabBar, AppHeader } from "@/components/app-nav";
import { ThemeToggle } from "@/app/theme-toggle";
import { NotificationBell } from "@/components/NotificationBell";
import { useMyStats } from "@/lib/queries/users";
import { loadLayoutPreset } from "@/lib/layout";
import { LayoutPreset } from "@/lib/layout-presets";
import { cn } from "@/lib/utils";
import shared from "@/app/shared.module.css";

function SideRail({ variant }: { variant: "side" | "split" }) {
  const pathname = usePathname();
  const myStats = useMyStats();
  const isSplit = variant === "split";

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh w-56 shrink-0 flex-col justify-between overflow-y-auto p-5 md:flex",
        isSplit ? "bg-primary text-primary-foreground" : "border-r border-border bg-elevated",
      )}
      style={isSplit ? { clipPath: "polygon(0 0, 100% 0, 88% 100%, 0 100%)", paddingRight: 28 } : undefined}
    >
      <div>
        <Link href="/home" className={cn("mb-8 flex items-center gap-2 font-semibold", isSplit ? "" : "text-foreground")}>
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold",
              isSplit ? "bg-white/20" : "bg-primary text-primary-foreground",
            )}
          >
            U
          </span>
          Unblur
        </Link>

        <nav className="flex flex-col gap-1">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                  isSplit
                    ? active
                      ? "bg-white/20"
                      : "text-primary-foreground/75 hover:bg-white/10"
                    : active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className={cn("mt-8 rounded-xl p-3", isSplit ? "bg-white/10" : "border border-border bg-card")}>
        <div className={cn("mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide", isSplit ? "text-primary-foreground/70" : "text-muted-foreground")}>
          <Trophy className="h-3 w-3" />
          Your score
        </div>
        <div className="num text-xl font-semibold">{myStats.data ? myStats.data.gdPoints.toFixed(1) : "—"}</div>
        <div className={cn("mt-2 flex items-center gap-2", isSplit ? "text-primary-foreground/85" : "")}>
          <ThemeToggle />
          <NotificationBell />
        </div>
      </div>
    </aside>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  // Lazy initializer, not an effect -- this component only ever mounts after
  // AppLayout's own hydration gate has already passed, so there's no SSR render
  // of this subtree to mismatch against; reading localStorage here is safe and
  // avoids a flash of the wrong shell on first paint.
  const [layout] = useState<LayoutPreset>(() => loadLayoutPreset());

  if (layout.mode === "top") {
    return (
      <div className={shared.wrap}>
        <AppHeader />
        <main style={{ paddingBottom: 80 }}>{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh">
      <SideRail variant={layout.mode} />
      <div className="min-w-0 flex-1 px-5 py-6 pb-24 md:pb-6">{children}</div>
      <MobileTabBar />
    </div>
  );
}
