"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AppHeader, AppTabBar } from "@/components/app-nav";
import shared from "../shared.module.css";

function noopSubscribe() {
  return () => {};
}

/** True once past the client's first render. Server/first-paint snapshot is false,
 * every snapshot after that is true -- gives us a one-tick "hydration done" flag
 * without setState-in-effect (same pattern as useIsLoggedIn in lib/auth.ts). */
function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  // useAuth() reports isLoggedIn=false on the very first client render (its
  // useSyncExternalStore server snapshot can't see localStorage) -- redirecting on
  // that alone bounces a genuinely logged-in user to /login on every reload before
  // hydration catches up. Wait one tick past hydration before trusting a "false".
  const hydrated = useHydrated();

  useEffect(() => {
    if (hydrated && !isLoggedIn) router.replace("/login");
  }, [hydrated, isLoggedIn, router]);

  if (!hydrated || !isLoggedIn) return null;

  return (
    <div className={shared.wrap}>
      <AppHeader />
      {/* padding-bottom leaves room for the fixed mobile tab bar */}
      <main style={{ paddingBottom: 80 }}>{children}</main>
      <AppTabBar />
    </div>
  );
}
