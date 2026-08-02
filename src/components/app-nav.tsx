"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Layers, ListChecks, Presentation, User, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ThemeToggle } from "@/app/theme-toggle";
import { NotificationBell } from "@/components/NotificationBell";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon; mobile: boolean };

const NAV: NavItem[] = [
  { href: "/home", label: "Home", icon: Home, mobile: true },
  { href: "/feed", label: "Feed", icon: Layers, mobile: true },
  { href: "/requests", label: "Requests", icon: ListChecks, mobile: true },
  { href: "/seminars", label: "Seminars", icon: Presentation, mobile: false },
  { href: "/gds", label: "GDs", icon: Users, mobile: true },
  { href: "/profile", label: "Profile", icon: User, mobile: true },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppHeader() {
  const pathname = usePathname();
  const mobileNav = NAV.filter((n) => n.mobile);

  return (
    <header className="sticky top-0 z-40 -mx-5 border-b border-border bg-background/85 px-5 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-3">
        <Link href="/home" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-semibold">U</span>
          </span>
          <span className="text-base">Unblur</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
                  active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <NotificationBell />
        </div>
      </div>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <div className="mx-auto flex max-w-3xl items-stretch justify-between px-2">
          {mobileNav.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.65rem] font-bold transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span className={cn("flex h-8 w-12 items-center justify-center rounded-full transition-colors", active && "bg-primary/12")}>
                  <Icon className="h-5 w-5" />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}

// the bottom tab bar now renders inside AppHeader itself so it shares the same
// sticky/blur treatment -- kept as a no-op so callers (app layout) don't need updating
export function AppTabBar() {
  return null;
}
