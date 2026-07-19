"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DoubtCardSkeleton } from "@/components/ui/Skeleton";
import { useMyExpertise } from "@/lib/queries/expertise";
import { useFeed } from "@/lib/queries/doubts";
import { Doubt } from "@/lib/api";
import { relativeTime } from "@/lib/relative-time";
import shared from "../../shared.module.css";
import styles from "./feed.module.css";

const STATUS_LABEL: Record<Doubt["status"], string> = {
  open: "Open",
  resolved: "Resolved",
  closed: "Closed",
};

function DoubtCard({ doubt }: { doubt: Doubt }) {
  return (
    <Card className={styles.doubtCard}>
      <div className={styles.doubtHeader}>
        <h3 className={styles.doubtTitle}>{doubt.title}</h3>
        {doubt.matchType === "related" && <span className={styles.relatedBadge}>Related</span>}
      </div>
      <p className={styles.doubtDescription}>{doubt.description}</p>
      <div className={styles.doubtMeta}>
        {doubt.status !== "open" && (
          <span className={styles.statusPill} data-status={doubt.status}>
            {STATUS_LABEL[doubt.status]}
          </span>
        )}
        <span className={styles.timestamp}>{relativeTime(doubt.createdAt)}</span>
      </div>
    </Card>
  );
}

export default function FeedPage() {
  const myExpertise = useMyExpertise();
  const expertiseLevelIds = useMemo(
    () => (myExpertise.data ?? []).map((e) => e.expertiseLevelId),
    [myExpertise.data],
  );
  const feed = useFeed(expertiseLevelIds);

  const hasNoExpertise = myExpertise.data !== undefined && myExpertise.data.length === 0;

  return (
    <PageTransition>
      <section className={styles.page}>
        <div className={styles.headerRow}>
          <h1 className={shared.heading}>Feed</h1>
          <Link href="/doubts/new" className={styles.postLink}>
            <Button type="button" style={{ width: "auto" }}>
              Post a doubt
            </Button>
          </Link>
        </div>

        {myExpertise.isLoading && (
          <div className={styles.list}>
            <Card>
              <DoubtCardSkeleton />
            </Card>
            <Card>
              <DoubtCardSkeleton />
            </Card>
            <Card>
              <DoubtCardSkeleton />
            </Card>
          </div>
        )}

        {hasNoExpertise && (
          <Card className={styles.emptyState}>
            <h3>Add your expertise to see doubts</h3>
            <p className={shared.muted}>
              Your feed shows doubts that match what you know. Tag your first subject or skill to
              start seeing matches.
            </p>
            <Link href="/profile">
              <Button type="button">Add expertise</Button>
            </Link>
          </Card>
        )}

        {!hasNoExpertise && !myExpertise.isLoading && feed.isLoading && (
          <div className={styles.list}>
            <Card>
              <DoubtCardSkeleton />
            </Card>
            <Card>
              <DoubtCardSkeleton />
            </Card>
            <Card>
              <DoubtCardSkeleton />
            </Card>
          </div>
        )}

        {!hasNoExpertise && feed.isError && (
          <Card className={styles.emptyState}>
            <h3>Couldn&apos;t load your feed</h3>
            <p className={shared.muted}>Something went wrong reaching the server.</p>
            <Button type="button" onClick={() => feed.refetch()}>
              Try again
            </Button>
          </Card>
        )}

        {!hasNoExpertise && feed.isSuccess && feed.data.length === 0 && (
          <Card className={styles.emptyState}>
            <h3>No open doubts in your areas right now</h3>
            <p className={shared.muted}>
              Check back soon — we&apos;ll show you doubts as they come in for your expertise.
            </p>
          </Card>
        )}

        {!hasNoExpertise && feed.isSuccess && feed.data.length > 0 && (
          <div className={styles.list}>
            {feed.data.map((doubt) => (
              <DoubtCard key={doubt.id} doubt={doubt} />
            ))}
          </div>
        )}
      </section>
    </PageTransition>
  );
}
