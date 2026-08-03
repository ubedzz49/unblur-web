"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Layers, ListChecks, Presentation, Settings, User, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ThemeToggle } from "@/app/theme-toggle";
import { NotificationBell } from "@/components/NotificationBell";
import { useTranslation } from "@/lib/i18n/context";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; labelKey: TranslationKey; icon: LucideIcon; mobile: boolean };

export const NAV: NavItem[] = [
  { href: "/home", labelKey: "nav.home", icon: Home, mobile: true },
  { href: "/feed", labelKey: "nav.feed", icon: Layers, mobile: true },
  { href: "/requests", labelKey: "nav.requests", icon: ListChecks, mobile: true },
  { href: "/seminars", labelKey: "nav.seminars", icon: Presentation, mobile: false },
  { href: "/gds", labelKey: "nav.gds", icon: Users, mobile: true },
  { href: "/profile", labelKey: "nav.profile", icon: User, mobile: true },
];

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileTabBar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const mobileNav = NAV.filter((n) => n.mobile);

  return (
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
              {t(item.labelKey)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppHeader() {
  const pathname = usePathname();
  const { t } = useTranslation();

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
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <NotificationBell />
          <Link
            href="/settings"
            aria-label={t("nav.settings")}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground",
              isActive(pathname, "/settings") && "border-primary text-primary",
            )}
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <MobileTabBar />
    </header>
  );
}
