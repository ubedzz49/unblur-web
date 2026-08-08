"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Globe, LogOut, ShieldCheck, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { Logo } from "@/components/Logo";
import { useTranslation } from "@/lib/i18n/context";
import { useIsAdmin } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import { LOCALES } from "@/lib/i18n/locales";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; labelKey: TranslationKey; icon?: LucideIcon; mobile: boolean };

/** The single nav structure for the app -- rendered as inline top-nav links on
 * desktop, collapsed behind a hamburger menu on mobile. */
export const NAV: NavItem[] = [
  { href: "/feed", labelKey: "nav.feed", mobile: true },
  { href: "/seminars", labelKey: "nav.seminars", mobile: true },
  { href: "/gds", labelKey: "nav.gds", mobile: true },
  { href: "/requests", labelKey: "nav.requests", mobile: true },
  { href: "/profile", labelKey: "nav.profile", mobile: true },
];

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

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
        className="flex h-9 items-center gap-1.5 rounded-full px-2 text-xs font-semibold text-[var(--dim)] transition-colors hover:text-[var(--paper)]"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{current.code.toUpperCase()}</span>
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 max-h-72 w-48 overflow-y-auto rounded-xl border p-1.5"
          style={{ borderColor: "var(--line)", background: "var(--surface-2)" }}
        >
          {LOCALES.map((locale) => (
            <button
              key={locale.code}
              type="button"
              onClick={() => {
                setLocale(locale.code);
                setOpen(false);
              }}
              className={cn(
                "flex w-full flex-col items-start rounded-lg px-3 py-1.5 text-left text-sm hover:bg-[var(--surface)]",
                locale.code === localeCode && "text-[var(--violet)]",
              )}
              style={locale.code === localeCode ? { background: "var(--violet-dim)" } : undefined}
            >
              <span className="font-medium">{locale.nativeName}</span>
              <span className="text-xs text-[var(--dim)]">{locale.englishName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Account menu"
        className="h-8 w-8 rounded-full"
        style={{ background: "var(--violet-dim)" }}
      />
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border p-1.5"
          style={{ borderColor: "var(--line)", background: "var(--surface-2)" }}
        >
          <Link
            href="/profile"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium hover:bg-[var(--surface)]"
            onClick={() => setOpen(false)}
          >
            <Settings className="h-4 w-4" />
            {t("nav.settings")}
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium hover:bg-[var(--surface)]"
              onClick={() => setOpen(false)}
            >
              <ShieldCheck className="h-4 w-4" />
              Admin
            </Link>
          )}
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-[var(--surface)]"
            style={{ color: "var(--red)" }}
          >
            <LogOut className="h-4 w-4" />
            {t("settings.logout")}
          </button>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Top nav bar -- sticky, blurred, border-bottom. Logo left, inline links center,
 * actions right. Mobile collapses inline links behind a hamburger.
 * -------------------------------------------------------------------------- */
export function TopNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-30 flex items-center justify-between border-b px-5 py-4 backdrop-blur-md sm:px-10"
      style={{ borderColor: "var(--line)", background: "rgba(15,14,20,0.85)" }}
    >
      <Link href="/home" className="flex items-center gap-2 text-[17px] font-bold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
        <Logo size={16} />
        unblur
      </Link>

      <div className="hidden items-center gap-8 text-[13.5px] md:flex" style={{ color: "var(--dim)" }}>
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-[var(--paper)]" style={active ? { color: "var(--paper)" } : undefined}>
              {t(item.labelKey)}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <Link
          href="/doubts/new"
          className="hidden items-center rounded-lg px-4 py-2 text-[13.5px] font-semibold sm:flex"
          style={{ background: "var(--violet)", color: "var(--ink-strong)" }}
        >
          {t("home.postDoubt")}
        </Link>
        <NotificationBell />
        <LanguageQuickPicker />
        <UserMenu />
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-full md:hidden"
          style={{ color: "var(--dim)" }}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-72 flex-col gap-1 border-l p-5" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-bold">Menu</span>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close" style={{ color: "var(--dim)" }}>
                <X className="h-5 w-5" />
              </button>
            </div>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold"
                style={isActive(pathname, item.href) ? { color: "var(--violet)", background: "var(--violet-dim)" } : { color: "var(--paper)" }}
              >
                {t(item.labelKey)}
              </Link>
            ))}
            <Link
              href="/doubts/new"
              onClick={() => setMobileOpen(false)}
              className="mt-3 rounded-lg px-3 py-2.5 text-center text-sm font-semibold"
              style={{ background: "var(--violet)", color: "var(--ink-strong)" }}
            >
              {t("home.postDoubt")}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
