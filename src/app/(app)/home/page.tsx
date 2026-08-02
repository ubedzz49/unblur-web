"use client";

import Link from "next/link";
import { useMe } from "@/lib/queries/users";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { SectionLabel } from "@/components/ui/SectionLabel";
import styles from "./home.module.css";

export default function HomePage() {
  const me = useMe();

  const firstName = me.data?.name?.trim().split(" ")[0];

  return (
    <PageTransition>
      {me.isLoading ? (
        <Skeleton width="50%" height={36} style={{ margin: "32px 0 28px" }} />
      ) : (
        <>
          <h1 className={`${styles.greeting} text-fluid-display`}>
            {firstName ? `Welcome back, ${firstName}.` : "Welcome back."}
          </h1>
          <p className={styles.subtitle}>What do you want to get unstuck on today?</p>
        </>
      )}

      <SectionLabel>Get started</SectionLabel>
      <div className={styles.actions}>
        <Link href="/doubts/new" className={styles.actionLink}>
          <Card className={`${styles.actionCard} ${styles.primaryAction}`}>
            <Pill tone="gold" className={styles.actionPill}>
              Ask
            </Pill>
            <h3>Post a doubt</h3>
            <p>Describe what&apos;s confusing you and get a real answer, live.</p>
          </Card>
        </Link>
        <Link href="/feed" className={styles.actionLink}>
          <Card className={styles.actionCard}>
            <Pill tone="neutral" className={styles.actionPill}>
              Browse
            </Pill>
            <h3>Browse the feed</h3>
            <p>See doubts that match what you know — and help someone out.</p>
          </Card>
        </Link>
      </div>
    </PageTransition>
  );
}
