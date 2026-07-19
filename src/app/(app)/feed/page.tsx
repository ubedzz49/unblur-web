"use client";

import { PageTransition } from "@/components/ui/PageTransition";
import shared from "../../shared.module.css";

export default function FeedPage() {
  return (
    <PageTransition>
      <section style={{ padding: "32px 0" }}>
        <h1 className={shared.heading}>Feed</h1>
        <p className={shared.muted} style={{ maxWidth: "44ch" }}>
          Your feed of matching doubts is coming soon. Once you add your expertise, this is
          where you&apos;ll see questions you can help with.
        </p>
      </section>
    </PageTransition>
  );
}
