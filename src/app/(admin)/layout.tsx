"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useIsAdmin } from "@/lib/auth";

function noopSubscribe() {
  return () => {};
}

// same hydration-guard trick as (app)/layout.tsx -- see that file's comment
function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

// The admin dashboard gets its own persistent left sidebar (see admin/Sidebar.tsx), not the
// main app's top nav or the centered `.wrap` column -- so this layout stays a thin guard and
// lets the page render the full-bleed sidebar+main grid itself.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
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

  return <>{children}</>;
}
