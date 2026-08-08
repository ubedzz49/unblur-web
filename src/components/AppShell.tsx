"use client";

import { TopNav } from "@/components/app-nav";

/** The one nav structure for the whole app: a sticky top nav bar (logo, inline
 * links, post-a-doubt CTA, bell, avatar) per the design mockups. There is no
 * persistent left sidebar anymore -- pages that need their own local sidebars
 * (e.g. feed's filter/stats rails) build those as page-local content. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopNav />
      <div className="mx-auto w-full flex-1" style={{ maxWidth: "var(--content-max-width)" }}>
        {children}
      </div>
    </div>
  );
}
