"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { Button } from "@/components/ui/Button";
import { Card, Pill } from "@/components/scoreboard/kit";
import { DoubtCardSkeleton } from "@/components/ui/Skeleton";
import { useMyExpertise, useExpertiseOptions } from "@/lib/queries/expertise";
import { useFeed, useMyDoubts } from "@/lib/queries/doubts";
import { useMe } from "@/lib/queries/users";
import { useResolutionRequestsForDoubt } from "@/lib/queries/resolution";
import { DoubtRequestsModal } from "@/components/DoubtRequestsModal";
import { Doubt } from "@/lib/api";
import { formatExpertiseLabel } from "@/lib/expertise-format";
import { relativeTime } from "@/lib/relative-time";
import { cn } from "@/lib/utils";
import shared from "../../shared.module.css";

const STATUS_LABEL: Record<Doubt["status"], string> = {
  open: "Open",
  resolved: "Resolved",
  closed: "Closed",
};

// tone per status pill -- resolved reads as a "win" (gold), closed is just neutral/archived
const STATUS_TONE: Record<Doubt["status"], "neutral" | "gold" | "danger" | "outline"> = {
  open: "outline",
  resolved: "gold",
  closed: "neutral",
};

// exact vs related feed matches get visually distinct pill tones so the difference
// reads at a glance, without a literal standalone "Related" label
const MATCH_LABEL: Record<Doubt["matchType"], string> = {
  exact: "Exact match",
  related: "Related match",
};
const MATCH_TONE: Record<Doubt["matchType"], "gold" | "outline"> = {
  exact: "gold",
  related: "outline",
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

function DoubtCard({
  doubt,
  subjectLabels,
  showOfferAction,
  showRequestsBadge,
  showMatchType,
  onOpenRequests,
}: {
  doubt: Doubt;
  subjectLabels: string[];
  showOfferAction?: boolean;
  showRequestsBadge?: boolean;
  showMatchType?: boolean;
  onOpenRequests?: (doubtId: string) => void;
}) {
  // only fetch when the badge is actually shown (the "My doubts" tab) -- no point
  // firing a requests query per card on the main Feed tab where this isn't shown
  const requests = useResolutionRequestsForDoubt(showRequestsBadge ? doubt.id : undefined);
  const requestCount = requests.data?.length ?? 0;

  return (
    <Card className="p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-pretty text-[0.95rem] font-bold leading-snug">{doubt.title}</h3>
        <div className="flex shrink-0 items-center gap-1.5">
          {showMatchType && <Pill tone={MATCH_TONE[doubt.matchType]}>{MATCH_LABEL[doubt.matchType]}</Pill>}
          {doubt.status !== "open" && <Pill tone={STATUS_TONE[doubt.status]}>{STATUS_LABEL[doubt.status]}</Pill>}
        </div>
      </div>

      {subjectLabels.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {subjectLabels.map((label) => (
            <span
              key={label}
              className="rounded-md bg-elevated px-2 py-0.5 text-xs font-semibold text-foreground"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {doubt.description && (
        <p className="mt-2 line-clamp-2 text-sm leading-snug text-muted-foreground">{doubt.description}</p>
      )}

      {showRequestsBadge && requestCount > 0 && (
        <button
          type="button"
          className="mt-3 inline-flex min-h-11 items-center rounded-full bg-elevated px-3.5 text-xs font-bold text-primary"
          onClick={(e) => {
            e.stopPropagation();
            onOpenRequests?.(doubt.id);
          }}
        >
          <span className="num">{requestCount}</span> {requestCount === 1 ? "offer" : "offers"}
        </button>
      )}

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
        <span className="text-xs text-muted-foreground">{relativeTime(doubt.createdAt)}</span>
        {showOfferAction && doubt.status === "open" && (
          <Link href={`/doubts/${doubt.id}/resolve`} onClick={(e) => e.stopPropagation()}>
            <Button type="button" variant="secondary" style={{ width: "auto" }}>
              Offer to help
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
}

type Tab = "feed" | "mine";

export default function FeedPage() {
  const [tab, setTab] = useState<Tab>("feed");
  const [requestsModalDoubtId, setRequestsModalDoubtId] = useState<string | null>(null);
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
      <section className="py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className={shared.heading}>Feed</h1>
          <Link href="/doubts/new" className="shrink-0">
            <Button type="button" style={{ width: "auto" }}>
              Post a doubt
            </Button>
          </Link>
        </div>

        <div role="tablist" className="mb-5 flex items-center gap-1.5">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "feed"}
            className={cn(
              "min-h-11 rounded-full border px-3.5 text-sm font-bold transition-colors",
              tab === "feed"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setTab("feed")}
          >
            Feed
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "mine"}
            className={cn(
              "min-h-11 rounded-full border px-3.5 text-sm font-bold transition-colors",
              tab === "mine"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setTab("mine")}
          >
            My doubts
          </button>
        </div>

        {tab === "feed" && (
          <>
            {myExpertise.isLoading && (
              <div className="space-y-3">
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
              <Card className="flex max-w-[440px] flex-col items-start gap-3 p-4">
                <h3 className="text-[1.05rem] font-extrabold">Add your expertise to see doubts</h3>
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
              <div className="space-y-3">
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
              <Card className="flex max-w-[440px] flex-col items-start gap-3 p-4">
                <h3 className="text-[1.05rem] font-extrabold">Couldn&apos;t load your feed</h3>
                <p className={shared.muted}>Something went wrong reaching the server.</p>
                <Button type="button" onClick={() => feed.refetch()}>
                  Try again
                </Button>
              </Card>
            )}

            {!hasNoExpertise && feed.isSuccess && othersFeed.length === 0 && (
              <Card className="flex max-w-[440px] flex-col items-start gap-3 p-4">
                <h3 className="text-[1.05rem] font-extrabold">No open doubts in your areas right now</h3>
                <p className={shared.muted}>
                  Check back soon — we&apos;ll show you doubts as they come in for your expertise.
                </p>
              </Card>
            )}

            {!hasNoExpertise && feed.isSuccess && othersFeed.length > 0 && (
              <div className="space-y-3">
                {othersFeed.map((doubt) => (
                  <DoubtCard
                    key={doubt.id}
                    doubt={doubt}
                    showOfferAction
                    showMatchType
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
              <div className="space-y-3">
                <Card>
                  <DoubtCardSkeleton />
                </Card>
                <Card>
                  <DoubtCardSkeleton />
                </Card>
              </div>
            )}

            {myDoubts.isError && (
              <Card className="flex max-w-[440px] flex-col items-start gap-3 p-4">
                <h3 className="text-[1.05rem] font-extrabold">Couldn&apos;t load your doubts</h3>
                <p className={shared.muted}>Something went wrong reaching the server.</p>
                <Button type="button" onClick={() => myDoubts.refetch()}>
                  Try again
                </Button>
              </Card>
            )}

            {myDoubts.isSuccess && myDoubts.data.length === 0 && (
              <Card className="flex max-w-[440px] flex-col items-start gap-3 p-4">
                <h3 className="text-[1.05rem] font-extrabold">You haven&apos;t posted a doubt yet</h3>
                <p className={shared.muted}>Doubts you post show up here so you can track them.</p>
                <Link href="/doubts/new">
                  <Button type="button">Post a doubt</Button>
                </Link>
              </Card>
            )}

            {myDoubts.isSuccess && myDoubts.data.length > 0 && (
              <div className="space-y-3">
                {myDoubts.data.map((doubt) => (
                  <DoubtCard
                    key={doubt.id}
                    doubt={doubt}
                    showRequestsBadge
                    onOpenRequests={setRequestsModalDoubtId}
                    subjectLabels={doubt.expertiseLevelIds.map((id) => labelLookup.get(id)).filter((l): l is string => Boolean(l))}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {requestsModalDoubtId && (
        <DoubtRequestsModal doubtId={requestsModalDoubtId} onClose={() => setRequestsModalDoubtId(null)} />
      )}
    </PageTransition>
  );
}
