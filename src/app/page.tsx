"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { PageTransition } from "@/components/ui/PageTransition";
import { SiteHeader } from "./site-header";
import shared from "./shared.module.css";

export default function Home() {
  const { isLoggedIn } = useAuth();

  return (
    <PageTransition className={shared.wrap}>
      <SiteHeader />
      <section style={{ padding: "60px 0" }}>
        <h1 className={shared.heading} style={{ maxWidth: "16ch" }}>
          Every room you speak in <span style={{ color: "var(--accent-2)" }}>keeps score</span>.
        </h1>
        <p className={shared.muted} style={{ maxWidth: "44ch", marginBottom: 24, fontSize: 17 }}>
          Post a doubt, get a real answer live, and build a communication record along the
          way.
        </p>
        <Link
          href={isLoggedIn ? "/profile" : "/login"}
          className={shared.button}
          style={{ display: "inline-block", width: "auto", padding: "14px 26px", textAlign: "center" }}
        >
          {isLoggedIn ? "Go to your profile" : "Log in"}
        </Link>
      </section>
    </PageTransition>
  );
}
