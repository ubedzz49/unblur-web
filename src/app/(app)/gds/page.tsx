"use client";

import Link from "next/link";
import { useGdEligibility, useGds } from "@/lib/queries/gds";
import { PageTransition } from "@/components/ui/PageTransition";
import type { Gd } from "@/lib/api";

function formatFee(cents: number): string {
  return cents === 0 ? "Free to join" : `₹${(cents / 100).toFixed(0)} entry`;
}

// Per-participant speaking cap: at most 1/10th of the room duration (matches
// gd-service's own rule, see NewGdPage) -- display-only.
function speakingCapMins(durationMins: number): number {
  return Math.round((durationMins / 10) * 10) / 10;
}

export default function GdsPage() {
  const gds = useGds(true);
  const eligibility = useGdEligibility();

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1000px] px-6 py-10">
        <div className="mb-7 flex items-center justify-between gap-3">
          <h1 className="text-fluid-title">Group discussions</h1>
          {eligibility.data?.canOrganizeGD ? (
            <Link
              href="/gds/new"
              className="rounded-lg px-5 py-3 text-[13.5px] font-semibold"
              style={{ background: "var(--violet)", color: "var(--ink-strong)" }}
            >
              Organize a GD
            </Link>
          ) : (
            <span className="text-xs" style={{ color: "var(--dim)" }}>
              Resolve 100+ minutes to organize a GD
            </span>
          )}
        </div>

        {eligibility.isSuccess && !eligibility.data.canAttendGD && (
          <p className="mb-5 text-sm" style={{ color: "var(--dim)" }}>
            Attend a GD once you&apos;ve listened for 50+ minutes.
          </p>
        )}

        {gds.isLoading && <p className="text-sm" style={{ color: "var(--dim)" }}>Loading GDs…</p>}
        {gds.isError && <p className="text-sm" style={{ color: "var(--dim)" }}>Couldn&apos;t load GDs.</p>}
        {gds.isSuccess && gds.data.length === 0 && <p className="text-sm" style={{ color: "var(--dim)" }}>No upcoming GDs yet.</p>}

        <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2">
          {gds.data?.map((gd: Gd) => (
            <Link
              key={gd.id}
              href={`/gds/${gd.id}`}
              className="block rounded-2xl border p-5.5"
              style={{ borderColor: "var(--line)", background: "var(--surface)" }}
            >
              <span
                className="mb-3 inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ background: "var(--violet-dim)", color: "var(--violet)" }}
              >
                {gd.status === "live" ? "Live now" : new Date(gd.scheduledAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
              <h3 className="mb-2.5 text-[17px] font-semibold">{gd.topic}</h3>
              <div className="mb-4 flex flex-wrap gap-3.5 text-xs" style={{ color: "var(--dim)" }}>
                <span>{gd.durationMins} min</span>
                <span>{speakingCapMins(gd.durationMins)} min speaking cap each</span>
                <span>Max 3 speakers</span>
              </div>
              <div className="flex items-center justify-between border-t pt-3.5" style={{ borderColor: "var(--line)" }}>
                <span className="text-[13.5px] font-semibold" style={{ color: gd.entryFeeCents === 0 ? "var(--dim)" : "var(--green)" }}>
                  {formatFee(gd.entryFeeCents)}
                </span>
                <span className="rounded-lg px-4 py-2 text-[12.5px] font-semibold" style={{ background: "var(--violet)", color: "var(--ink-strong)" }}>
                  {gd.status === "live" ? "Join" : "View"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
