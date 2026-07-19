"use client";

import Link from "next/link";
import { useMe } from "@/lib/queries/users";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/PageTransition";
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
          <h1 className={styles.greeting}>
            {firstName ? `Welcome back, ${firstName}.` : "Welcome back."}
          </h1>
          <p className={styles.subtitle}>What do you want to get unstuck on today?</p>
        </>
      )}

      <div className={styles.actions}>
        <Link href="/doubts/new" className={`${styles.actionCard} ${styles.primaryAction}`}>
          <h3>Post a doubt</h3>
          <p>Describe what&apos;s confusing you and get a real answer, live.</p>
        </Link>
        <Link href="/feed" className={styles.actionCard}>
          <h3>Browse the feed</h3>
          <p>See doubts that match what you know — and help someone out.</p>
        </Link>
      </div>
    </PageTransition>
  );
}
