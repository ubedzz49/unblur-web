"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DoubtCardSkeleton } from "@/components/ui/Skeleton";
import { useMyExpertise, useExpertiseOptions } from "@/lib/queries/expertise";
import { useFeed, useMyDoubts } from "@/lib/queries/doubts";
import { useMe } from "@/lib/queries/users";
import { Doubt } from "@/lib/api";
import { formatExpertiseLabel } from "@/lib/expertise-format";
import { relativeTime } from "@/lib/relative-time";
import shared from "../../shared.module.css";
import styles from "./feed.module.css";

const STATUS_LABEL: Record<Doubt["status"], string> = {
  open: "Open",
  resolved: "Resolved",
  closed: "Closed",
};

function useExpertiseLabelLookup(): Map<string, string> {
  const options = useExpertiseOptions();
  return useMemo(() => {
    const map = new Map<string, string>();
    for (const type of options.data ?? []) {
      for (const level of type.levels) {
        map.set(level.id, formatExpertiseLabel(type.name, level.name));
      }
    }
    return map;
  }, [options.data]);
}

function DoubtCard({ doubt, subjectLabels }: { doubt: Doubt; subjectLabels: string[] }) {
  return (
    <Card className={styles.doubtCard} tabIndex={0}>
      <div className={styles.doubtHeader}>
        <h3 className={styles.doubtTitle} title={doubt.title}>
          {doubt.title}
        </h3>
        {doubt.status !== "open" && (
          <span className={styles.statusPill} data-status={doubt.status}>
            {STATUS_LABEL[doubt.status]}
          </span>
        )}
      </div>

      <div className={styles.doubtDetails}>
        {subjectLabels.length > 0 && <p className={styles.subjectLabel}>{subjectLabels.join(" · ")}</p>}
        {doubt.description && <p className={styles.doubtDescription}>{doubt.description}</p>}
      </div>

      <div className={styles.doubtMeta}>
        <span className={styles.timestamp}>{relativeTime(doubt.createdAt)}</span>
        <span className={styles.hoverHint}>Hover for details</span>
      </div>
    </Card>
  );
}

type Tab = "feed" | "mine";

export default function FeedPage() {
  const [tab, setTab] = useState<Tab>("feed");
  const me = useMe();
  const myExpertise = useMyExpertise();
  const labelLookup = useExpertiseLabelLookup();

  const expertiseLevelIds = useMemo(
    () => (myExpertise.data ?? []).map((e) => e.expertiseLevelId),
    [myExpertise.data],
  );
  const feed = useFeed(expertiseLevelIds);
  const myDoubts = useMyDoubts(me.data?.id);

  // the feed is for doubts other people can help with -- doubts you posted yourself
  // live under the "My doubts" tab instead, not mixed into the same list
  const othersFeed = useMemo(
    () => (feed.data ?? []).filter((d) => d.authorUserId !== me.data?.id),
    [feed.data, me.data?.id],
  );

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

        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "feed"}
            className={styles.tab}
            data-active={tab === "feed"}
            onClick={() => setTab("feed")}
          >
            Feed
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "mine"}
            className={styles.tab}
            data-active={tab === "mine"}
            onClick={() => setTab("mine")}
          >
            My doubts
          </button>
        </div>

        {tab === "feed" && (
          <>
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
                  Your feed shows doubts that match what you know. Tag your first subject or skill
                  to start seeing matches.
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

            {!hasNoExpertise && feed.isSuccess && othersFeed.length === 0 && (
              <Card className={styles.emptyState}>
                <h3>No open doubts in your areas right now</h3>
                <p className={shared.muted}>
                  Check back soon — we&apos;ll show you doubts as they come in for your expertise.
                </p>
              </Card>
            )}

            {!hasNoExpertise && feed.isSuccess && othersFeed.length > 0 && (
              <div className={styles.list}>
                {othersFeed.map((doubt) => (
                  <DoubtCard
                    key={doubt.id}
                    doubt={doubt}
                    subjectLabels={doubt.expertiseLevelIds.map((id) => labelLookup.get(id)).filter((l): l is string => Boolean(l))}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "mine" && (
          <>
            {myDoubts.isLoading && (
              <div className={styles.list}>
                <Card>
                  <DoubtCardSkeleton />
                </Card>
                <Card>
                  <DoubtCardSkeleton />
                </Card>
              </div>
            )}

            {myDoubts.isError && (
              <Card className={styles.emptyState}>
                <h3>Couldn&apos;t load your doubts</h3>
                <p className={shared.muted}>Something went wrong reaching the server.</p>
                <Button type="button" onClick={() => myDoubts.refetch()}>
                  Try again
                </Button>
              </Card>
            )}

            {myDoubts.isSuccess && myDoubts.data.length === 0 && (
              <Card className={styles.emptyState}>
                <h3>You haven&apos;t posted a doubt yet</h3>
                <p className={shared.muted}>Doubts you post show up here so you can track them.</p>
                <Link href="/doubts/new">
                  <Button type="button">Post a doubt</Button>
                </Link>
              </Card>
            )}

            {myDoubts.isSuccess && myDoubts.data.length > 0 && (
              <div className={styles.list}>
                {myDoubts.data.map((doubt) => (
                  <DoubtCard
                    key={doubt.id}
                    doubt={doubt}
                    subjectLabels={doubt.expertiseLevelIds.map((id) => labelLookup.get(id)).filter((l): l is string => Boolean(l))}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </PageTransition>
  );
}
