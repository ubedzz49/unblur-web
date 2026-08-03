"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Layers, ListChecks, MoreHorizontal, Presentation, Settings, User, Users, X, Globe, LogOut, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ThemeToggle } from "@/app/theme-toggle";
import { NotificationBell } from "@/components/NotificationBell";
import { useTranslation } from "@/lib/i18n/context";
import { useIsAdmin } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import { LOCALES } from "@/lib/i18n/locales";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; labelKey: TranslationKey; icon: LucideIcon; mobile: boolean };

/** The single nav structure for the app -- desktop sidebar shows all of these,
 * mobile tab bar shows the ones flagged `mobile`, the rest live in the "More" sheet. */
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

/* ----------------------------------------------------------------------------
 * Desktop sidebar -- persistent left rail, icon + label, user menu at the bottom
 * -------------------------------------------------------------------------- */
export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col justify-between overflow-y-auto border-r border-border bg-elevated p-4 md:flex">
      <div>
        <Link href="/home" className="mb-6 flex items-center gap-2 px-2 py-1 font-semibold text-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">U</span>
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
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-card hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="relative">
        {menuOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-full rounded-xl border border-border bg-card p-1.5 shadow-lg" style={{ boxShadow: "var(--shell-shadow)" }}>
            <Link
              href="/settings"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-elevated"
              onClick={() => setMenuOpen(false)}
            >
              <Settings className="h-4 w-4" />
              {t("nav.settings")}
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-elevated"
                onClick={() => setMenuOpen(false)}
              >
                <ShieldCheck className="h-4 w-4" />
                Admin
              </Link>
            )}
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-destructive hover:bg-elevated"
            >
              <LogOut className="h-4 w-4" />
              {t("settings.logout")}
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
            menuOpen ? "bg-card text-foreground" : "text-muted-foreground hover:bg-card hover:text-foreground",
          )}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary">
            <User className="h-3.5 w-3.5" />
          </span>
          {t("nav.settings")}
        </button>
      </div>
    </aside>
  );
}

/* ----------------------------------------------------------------------------
 * Top bar -- lives inside the main content column, not full width. Title/breadcrumb
 * on the left, global CTA + bell + language + theme on the right.
 * -------------------------------------------------------------------------- */
function LanguageQuickPicker() {
  const { localeCode, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = LOCALES.find((l) => l.code === localeCode) ?? LOCALES[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Change language"
        aria-expanded={open}
        className="flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <Globe className="h-3.5 w-3.5" />
        {current.code.toUpperCase()}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 max-h-72 w-48 overflow-y-auto rounded-xl border border-border bg-card p-1.5" style={{ boxShadow: "var(--shell-shadow)" }}>
          {LOCALES.map((locale) => (
            <button
              key={locale.code}
              type="button"
              onClick={() => {
                setLocale(locale.code);
                setOpen(false);
              }}
              className={cn(
                "flex w-full flex-col items-start rounded-lg px-3 py-1.5 text-left text-sm hover:bg-elevated",
                locale.code === localeCode && "bg-primary/10 text-primary",
              )}
            >
              <span className="font-medium">{locale.nativeName}</span>
              <span className="text-xs text-muted-foreground">{locale.englishName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function TopBar({ title }: { title?: string }) {
  const { t } = useTranslation();

  return (
    <div className="mb-6 flex items-center gap-3">
      <h1 className="min-w-0 flex-1 truncate text-lg font-bold tracking-tight text-foreground md:text-xl">{title}</h1>
      <Link
        href="/doubts/new"
        className="hidden items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:flex"
      >
        {t("home.postDoubt")}
      </Link>
      <NotificationBell />
      <LanguageQuickPicker />
      <ThemeToggle />
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Mobile bottom tab bar + overflow "More" sheet
 * -------------------------------------------------------------------------- */
export function MobileTabBar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = useState(false);
  const mobileNav = NAV.filter((n) => n.mobile);
  const overflowNav = NAV.filter((n) => !n.mobile);

  return (
    <>
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
          {overflowNav.length > 0 && (
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.65rem] font-bold text-muted-foreground"
            >
              <span className="flex h-8 w-12 items-center justify-center rounded-full">
                <MoreHorizontal className="h-5 w-5" />
              </span>
              More
            </button>
          )}
        </div>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMoreOpen(false)} />
          <div className="relative w-full rounded-t-2xl border-t border-border bg-card p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-bold">More</span>
              <button type="button" onClick={() => setMoreOpen(false)} aria-label="Close" className="rounded-full p-1 text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {overflowNav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-elevated"
                  >
                    <Icon className="h-4 w-4" />
                    {t(item.labelKey)}
                  </Link>
                );
              })}
              <Link
                href="/settings"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-elevated"
              >
                <Settings className="h-4 w-4" />
                {t("nav.settings")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
