"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AppHeader, AppTabBar } from "@/components/app-nav";
import shared from "../shared.module.css";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  if (!isLoggedIn) return null;

  return (
    <div className={shared.wrap}>
      <AppHeader />
      {/* padding-bottom leaves room for the fixed mobile tab bar */}
      <main style={{ paddingBottom: 80 }}>{children}</main>
      <AppTabBar />
    </div>
  );
}
