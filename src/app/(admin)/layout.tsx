"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useIsAdmin } from "@/lib/auth";
import shared from "../shared.module.css";

function noopSubscribe() {
  return () => {};
}

// same hydration-guard trick as (app)/layout.tsx -- see that file's comment
function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoggedIn, logout } = useAuth();
  const isAdmin = useIsAdmin();
  const hydrated = useHydrated();

  useEffect(() => {
    if (!hydrated) return;
    if (!isLoggedIn) {
      router.replace("/login");
    } else if (!isAdmin) {
      // a real, logged-in user who just isn't an admin -- send them to their own home,
      // not back to login (they're not doing anything wrong)
      router.replace("/home");
    }
  }, [hydrated, isLoggedIn, isAdmin, router]);

  if (!hydrated || !isLoggedIn || !isAdmin) return null;

  return (
    <div className={shared.wrap}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0" }}>
        <span style={{ fontWeight: 800, fontSize: 18 }}>Unblur admin</span>
        <button
          type="button"
          onClick={() => {
            logout();
            router.push("/login");
          }}
          style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}
        >
          Log out
        </button>
      </header>
      <main style={{ paddingBottom: 40 }}>{children}</main>
    </div>
  );
}
