"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { DoubtCardSkeleton } from "@/components/ui/Skeleton";
import { useMyExpertise, useExpertiseOptions } from "@/lib/queries/expertise";
import { useFeed, useMyDoubts } from "@/lib/queries/doubts";
import { useMe, useMyStats } from "@/lib/queries/users";
import { useResolutionRequestsForDoubt } from "@/lib/queries/resolution";
import { DoubtRequestsModal } from "@/components/DoubtRequestsModal";
import { Doubt, ExpertiseTypeOption } from "@/lib/api";
import { formatExpertiseLabel } from "@/lib/expertise-format";
import { relativeTime } from "@/lib/relative-time";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<Doubt["status"], string> = {
  open: "Open",
  resolved: "Resolved",
  closed: "Closed",
};

// One tag color per taxonomy type, exactly as feed-page.html's .tag.academic/.competitive/.corporate
const TYPE_TAG_STYLE: Record<string, React.CSSProperties> = {
  academic: { background: "rgba(127,179,255,0.15)", color: "var(--blue)" },
  competitive: { background: "var(--violet-dim)", color: "var(--violet)" },
  corporate: { background: "rgba(127,217,154,0.15)", color: "var(--green)" },
};

function tagStyle(type: string | undefined): React.CSSProperties {
  return (type && TYPE_TAG_STYLE[type]) || TYPE_TAG_STYLE.competitive;
}

type SubjectTag = { label: string; type: string };

function useSubjectLookup(): Map<string, SubjectTag> {
  const options = useExpertiseOptions();
  return useMemo(() => {
    const map = new Map<string, SubjectTag>();
    for (const type of (options.data ?? []) as ExpertiseTypeOption[]) {
      for (const level of type.levels) {
        map.set(level.id, { label: formatExpertiseLabel(type.name, level.name), type: type.type });
      }
    }
    return map;
  }, [options.data]);
}

function DoubtCard({
  doubt,
  subjects,
  showOfferAction,
  showRequestsBadge,
  onOpenRequests,
}: {
  doubt: Doubt;
  subjects: SubjectTag[];
  showOfferAction?: boolean;
  showRequestsBadge?: boolean;
  onOpenRequests?: (doubtId: string) => void;
}) {
  const requests = useResolutionRequestsForDoubt(showRequestsBadge ? doubt.id : undefined);
  const requestCount = requests.data?.length ?? 0;
  const primary = subjects[0];

  return (
    <div className="mb-3.5 rounded-2xl border p-5" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {subjects.length > 0 ? (
            subjects.map((s) => (
              <span key={s.label} className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={tagStyle(s.type)}>
                {s.label}
              </span>
            ))
          ) : (
            <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={tagStyle(primary?.type)}>
              General
            </span>
          )}
          {doubt.status !== "open" && (
            <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: "var(--surface-2)", color: "var(--dim)" }}>
              {STATUS_LABEL[doubt.status]}
            </span>
          )}
        </div>
        <span className="shrink-0 text-xs" style={{ color: "var(--dim)" }}>{relativeTime(doubt.createdAt)}</span>
      </div>

      <h3 className="mb-1.5 text-[16px] font-semibold">{doubt.title}</h3>
      {doubt.description && (
        <p className="mb-3.5 line-clamp-2 text-[13.5px]" style={{ color: "var(--dim)" }}>{doubt.description}</p>
      )}

      <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--line)" }}>
        {showRequestsBadge ? (
          requestCount > 0 ? (
            <button
              type="button"
              className="flex items-center gap-1.5 text-[12.5px]"
              style={{ color: "var(--dim)" }}
              onClick={(e) => {
                e.stopPropagation();
                onOpenRequests?.(doubt.id);
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--green)" }} />
              {requestCount} {requestCount === 1 ? "offer" : "offers"} so far
            </button>
          ) : (
            <span className="text-[12.5px]" style={{ color: "var(--dim)" }}>Nothing yet</span>
          )
        ) : (
          <span className="flex items-center gap-1.5 text-[12.5px]" style={{ color: "var(--dim)" }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--green)" }} />
            Open doubt
          </span>
        )}
        {showOfferAction && doubt.status === "open" && (
          <Link
            href={`/doubts/${doubt.id}/resolve`}
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg border px-4 py-2 text-[12.5px] font-semibold"
            style={{ borderColor: "var(--violet)", color: "var(--violet)" }}
          >
            Offer to help
          </Link>
        )}
      </div>
    </div>
  );
}

type Tab = "feed" | "mine";

export default function FeedPage() {
  const [tab, setTab] = useState<Tab>("feed");
  const [requestsModalDoubtId, setRequestsModalDoubtId] = useState<string | null>(null);
  const me = useMe();
  const myExpertise = useMyExpertise();
  const myStats = useMyStats();
  const subjectLookup = useSubjectLookup();

  const expertiseLevelIds = useMemo(() => (myExpertise.data ?? []).map((e) => e.expertiseLevelId), [myExpertise.data]);
  const feed = useFeed(expertiseLevelIds);
  const myDoubts = useMyDoubts(me.data?.id);

  const othersFeed = useMemo(() => (feed.data ?? []).filter((d) => d.authorUserId !== me.data?.id), [feed.data, me.data?.id]);
  const hasNoExpertise = myExpertise.data !== undefined && myExpertise.data.length === 0;

  // sidebar filter counts: one bucket per tagged expertise, sourced from the same
  // feed response so the numbers always match what's actually rendered
  const filterCounts = useMemo(() => {
    return (myExpertise.data ?? []).map((entry) => ({
      levelId: entry.expertiseLevelId,
      // sidebar labels stay short (type name only) -- the full "Type (Level)" label
      // is reserved for the doubt-card tags themselves, so the two never collide
      label: entry.expertiseTypeName,
      count: othersFeed.filter((d) => d.expertiseLevelIds.includes(entry.expertiseLevelId)).length,
    }));
  }, [myExpertise.data, othersFeed]);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const visibleFeed = useMemo(() => {
    if (activeFilter === "all") return othersFeed;
    return othersFeed.filter((d) => d.expertiseLevelIds.includes(activeFilter));
  }, [othersFeed, activeFilter]);

  function subjectsFor(doubt: Doubt): SubjectTag[] {
    return doubt.expertiseLevelIds.map((id) => subjectLookup.get(id)).filter((s): s is SubjectTag => Boolean(s));
  }

  return (
    <PageTransition>
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_260px]">
        <aside className="hidden border-r px-5 py-7 lg:block" style={{ borderColor: "var(--line)" }}>
          <h4 className="mb-3.5 text-[11.5px] font-semibold uppercase tracking-wide" style={{ color: "var(--dim)" }}>
            Your expertise
          </h4>
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className="mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[13.5px]"
            style={activeFilter === "all" ? { background: "var(--violet-dim)", color: "var(--violet)" } : { color: "var(--paper)" }}
          >
            <span>All matching</span>
            <span className="text-[11.5px]" style={{ color: activeFilter === "all" ? "var(--violet)" : "var(--dim)" }}>{othersFeed.length}</span>
          </button>
          {filterCounts.map((f) => (
            <button
              key={f.levelId}
              type="button"
              onClick={() => setActiveFilter(f.levelId)}
              className="mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[13.5px]"
              style={activeFilter === f.levelId ? { background: "var(--violet-dim)", color: "var(--violet)" } : { color: "var(--paper)" }}
            >
              <span className="truncate">{f.label}</span>
              <span className="text-[11.5px]" style={{ color: activeFilter === f.levelId ? "var(--violet)" : "var(--dim)" }}>{f.count}</span>
            </button>
          ))}
        </aside>

        <main className="mx-auto w-full max-w-[640px] px-5 py-7">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h1 className="text-fluid-title">Feed</h1>
            <Link
              href="/doubts/new"
              className="shrink-0 rounded-lg px-4 py-2 text-[13.5px] font-semibold"
              style={{ background: "var(--violet)", color: "var(--ink-strong)" }}
            >
              Post a doubt
            </Link>
          </div>

          <div role="tablist" className="mb-5 flex items-center gap-1.5">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "feed"}
              className={cn("rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors")}
              style={tab === "feed" ? { borderColor: "var(--violet)", background: "var(--violet-dim)", color: "var(--violet)" } : { borderColor: "var(--line)", color: "var(--dim)" }}
              onClick={() => setTab("feed")}
            >
              Feed
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "mine"}
              className={cn("rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors")}
              style={tab === "mine" ? { borderColor: "var(--violet)", background: "var(--violet-dim)", color: "var(--violet)" } : { borderColor: "var(--line)", color: "var(--dim)" }}
              onClick={() => setTab("mine")}
            >
              My doubts
            </button>
          </div>

          <Link
            href="/doubts/new"
            className="mb-5 flex items-center gap-3 rounded-2xl border px-4.5 py-4"
            style={{ borderColor: "var(--line)", background: "var(--surface)" }}
          >
            <span className="h-8 w-8 shrink-0 rounded-full" style={{ background: "var(--violet-dim)" }} />
            <span className="text-sm" style={{ color: "var(--dim)" }}>What&apos;s confusing you right now?</span>
          </Link>

          {tab === "feed" && (
            <>
              {myExpertise.isLoading && (
                <div className="space-y-3">
                  <DoubtCardSkeleton />
                  <DoubtCardSkeleton />
                  <DoubtCardSkeleton />
                </div>
              )}

              {hasNoExpertise && (
                <div className="max-w-[440px] rounded-2xl border p-6" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
                  <h3 className="mb-2 text-[1.05rem] font-bold">Add your expertise to see doubts</h3>
                  <p className="mb-3.5 text-sm" style={{ color: "var(--dim)" }}>
                    Your feed shows doubts that match what you know. Tag your first subject or skill to start seeing
                    matches.
                  </p>
                  <Link href="/profile" className="inline-block rounded-lg px-4 py-2.5 text-sm font-semibold" style={{ background: "var(--violet)", color: "var(--ink-strong)" }}>
                    Add expertise
                  </Link>
                </div>
              )}

              {!hasNoExpertise && !myExpertise.isLoading && feed.isLoading && (
                <div className="space-y-3">
                  <DoubtCardSkeleton />
                  <DoubtCardSkeleton />
                  <DoubtCardSkeleton />
                </div>
              )}

              {!hasNoExpertise && feed.isError && (
                <div className="max-w-[440px] rounded-2xl border p-6" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
                  <h3 className="mb-2 text-[1.05rem] font-bold">Couldn&apos;t load your feed</h3>
                  <p className="mb-3.5 text-sm" style={{ color: "var(--dim)" }}>Something went wrong reaching the server.</p>
                  <button
                    type="button"
                    onClick={() => feed.refetch()}
                    className="rounded-lg px-4 py-2.5 text-sm font-semibold"
                    style={{ background: "var(--violet)", color: "var(--ink-strong)" }}
                  >
                    Try again
                  </button>
                </div>
              )}

              {!hasNoExpertise && feed.isSuccess && othersFeed.length === 0 && (
                <div className="max-w-[440px] rounded-2xl border p-6" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
                  <h3 className="mb-2 text-[1.05rem] font-bold">No open doubts in your areas right now</h3>
                  <p className="text-sm" style={{ color: "var(--dim)" }}>Check back soon — we&apos;ll show you doubts as they come in for your expertise.</p>
                </div>
              )}

              {!hasNoExpertise && feed.isSuccess && othersFeed.length > 0 && (
                <div>
                  {visibleFeed.map((doubt) => (
                    <DoubtCard key={doubt.id} doubt={doubt} showOfferAction subjects={subjectsFor(doubt)} />
                  ))}
                </div>
              )}
            </>
          )}

          {tab === "mine" && (
            <>
              {myDoubts.isLoading && (
                <div className="space-y-3">
                  <DoubtCardSkeleton />
                  <DoubtCardSkeleton />
                </div>
              )}

              {myDoubts.isError && (
                <div className="max-w-[440px] rounded-2xl border p-6" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
                  <h3 className="mb-2 text-[1.05rem] font-bold">Couldn&apos;t load your doubts</h3>
                  <p className="mb-3.5 text-sm" style={{ color: "var(--dim)" }}>Something went wrong reaching the server.</p>
                  <button
                    type="button"
                    onClick={() => myDoubts.refetch()}
                    className="rounded-lg px-4 py-2.5 text-sm font-semibold"
                    style={{ background: "var(--violet)", color: "var(--ink-strong)" }}
                  >
                    Try again
                  </button>
                </div>
              )}

              {myDoubts.isSuccess && myDoubts.data.length === 0 && (
                <div className="max-w-[440px] rounded-2xl border p-6" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
                  <h3 className="mb-2 text-[1.05rem] font-bold">You haven&apos;t posted a doubt yet</h3>
                  <p className="mb-3.5 text-sm" style={{ color: "var(--dim)" }}>Doubts you post show up here so you can track them.</p>
                  <Link href="/doubts/new" className="inline-block rounded-lg px-4 py-2.5 text-sm font-semibold" style={{ background: "var(--violet)", color: "var(--ink-strong)" }}>
                    Post a doubt
                  </Link>
                </div>
              )}

              {myDoubts.isSuccess && myDoubts.data.length > 0 && (
                <div>
                  {myDoubts.data.map((doubt) => (
                    <DoubtCard
                      key={doubt.id}
                      doubt={doubt}
                      showRequestsBadge
                      onOpenRequests={setRequestsModalDoubtId}
                      subjects={subjectsFor(doubt)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </main>

        <aside className="hidden border-l px-5 py-7 lg:block" style={{ borderColor: "var(--line)" }}>
          <h4 className="mb-3.5 text-[11.5px] font-semibold uppercase tracking-wide" style={{ color: "var(--dim)" }}>
            Your numbers
          </h4>
          <div className="mb-3.5 rounded-xl border p-4" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
            <div className="num text-[22px] font-bold" style={{ color: "var(--violet)" }}>{myStats.data?.minutesResolved ?? "—"}</div>
            <div className="mt-0.5 text-xs" style={{ color: "var(--dim)" }}>minutes resolved</div>
          </div>
          <div className="mb-3.5 rounded-xl border p-4" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
            <div className="num text-[22px] font-bold" style={{ color: "var(--violet)" }}>
              {myStats.data ? myStats.data.avgRating.toFixed(1) : "—"}
            </div>
            <div className="mt-0.5 text-xs" style={{ color: "var(--dim)" }}>average rating</div>
          </div>
        </aside>
      </div>

      {requestsModalDoubtId && <DoubtRequestsModal doubtId={requestsModalDoubtId} onClose={() => setRequestsModalDoubtId(null)} />}
    </PageTransition>
  );
}
