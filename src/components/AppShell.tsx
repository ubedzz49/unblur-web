"use client";

import { usePathname } from "next/navigation";
import { Sidebar, MobileTabBar, TopBar, NAV } from "@/components/app-nav";
import { useTranslation } from "@/lib/i18n/context";

/** The one nav structure for the whole app: a persistent left sidebar on desktop
 * (icon+label, user menu at the bottom for settings/admin/logout) and a bottom
 * tab bar + "More" sheet on mobile. The old 8-way top/side/split preset branching
 * is gone -- every page renders through this single shell. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const activeItem = NAV.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const title = activeItem ? t(activeItem.labelKey) : undefined;

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="min-w-0 flex-1 px-5 py-6 pb-24 md:pb-6">
        <div className="mx-auto w-full" style={{ maxWidth: "var(--content-max-width)" }}>
          <TopBar title={title} />
          {children}
        </div>
      </div>
      <MobileTabBar />
    </div>
  );
}
