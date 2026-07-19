"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/app/theme-toggle";
import styles from "./app-nav.module.css";

const TABS = [
  { href: "/home", label: "Home", icon: "⌂" },
  { href: "/feed", label: "Feed", icon: "≋" },
  { href: "/requests", label: "Requests", icon: "⇄" },
  { href: "/profile", label: "Profile", icon: "☺" },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <Link href="/home" className={styles.brand}>
        UNBLUR
      </Link>
      <div className={styles.headerRight}>
        <nav className={styles.desktopTabs}>
          {TABS.map((tab) => (
            <Link key={tab.href} href={tab.href} data-active={isActive(pathname, tab.href)}>
              {tab.label}
            </Link>
          ))}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}

export function AppTabBar() {
  const pathname = usePathname();

  return (
    <nav className={styles.tabBar} aria-label="Primary">
      {TABS.map((tab) => (
        <Link key={tab.href} href={tab.href} data-active={isActive(pathname, tab.href)}>
          <span className={styles.tabIcon} aria-hidden="true">
            {tab.icon}
          </span>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
