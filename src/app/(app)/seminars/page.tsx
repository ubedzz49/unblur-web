"use client";

import Link from "next/link";
import { useState } from "react";
import { useSeminarEligibility, useSeminars } from "@/lib/queries/seminars";
import { useMyStats } from "@/lib/queries/users";
import { usePublicUser } from "@/lib/queries/users";
import { PageTransition } from "@/components/ui/PageTransition";
import type { Seminar } from "@/lib/api";

function formatFee(cents: number): string {
  return cents === 0 ? "Free to join" : `₹${(cents / 100).toFixed(0)} entry`;
}

function HostRow({ hostUserId }: { hostUserId: string }) {
  const host = usePublicUser(hostUserId);
  return (
    <div className="mb-3.5 flex items-center gap-2.5">
      <span className="h-6.5 w-6.5 shrink-0 rounded-full" style={{ background: "var(--violet-dim)" }} />
      <span className="text-[12.5px]" style={{ color: "var(--dim)" }}>
        {host.data?.name ?? "Resolver"}
        {host.data ? `, ${host.data.stats.avgRating.toFixed(1)} average rating` : ""}
      </span>
    </div>
  );
}

function EligibilityModal({ onClose }: { onClose: () => void }) {
  const stats = useMyStats();
  const minutesResolved = stats.data?.minutesResolved ?? 0;
  const avgRating = stats.data?.avgRating ?? 0;
  const minutesMet = minutesResolved >= 300;
  const ratingMet = avgRating >= 3.5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5" role="dialog" aria-modal="true">
      <div className="w-full max-w-[380px] rounded-[18px] border p-7" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
        <h3 className="mb-2.5 text-[19px] font-semibold" style={{ fontFamily: "var(--font-fraunces)" }}>Almost there</h3>
        <p className="mb-5 text-[13.5px]" style={{ color: "var(--dim)" }}>Hosting a seminar needs both of these, not just one.</p>

        <div className="mb-4">
          <div className="mb-1.5 flex justify-between text-[13px]">
            <span>Minutes resolved</span>
            <span style={{ color: minutesMet ? "var(--green)" : "var(--paper)" }}>{minutesResolved} / 300</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full" style={{ background: "#242233" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.min(100, (minutesResolved / 300) * 100)}%`, background: minutesMet ? "var(--green)" : "var(--violet)" }}
            />
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-1.5 flex justify-between text-[13px]">
            <span>Average rating</span>
            <span style={{ color: ratingMet ? "var(--green)" : "var(--paper)" }}>
              {avgRating.toFixed(1)} / 3.5{ratingMet ? ", met" : ""}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full" style={{ background: "#242233" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.min(100, (avgRating / 3.5) * 100)}%`, background: ratingMet ? "var(--green)" : "var(--violet)" }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-lg border py-3 text-[13.5px]"
          style={{ borderColor: "var(--line)", color: "var(--paper)" }}
        >
          Keep resolving doubts
        </button>
      </div>
    </div>
  );
}

export default function SeminarsPage() {
  const seminars = useSeminars(true);
  const eligibility = useSeminarEligibility();
  const [showEligibility, setShowEligibility] = useState(false);

  function handleHostClick(e: React.MouseEvent) {
    if (!eligibility.data?.canHostSeminar) {
      e.preventDefault();
      setShowEligibility(true);
    }
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1000px] px-6 py-10">
        <div className="mb-7 flex items-center justify-between gap-3">
          <h1 className="text-fluid-title">Seminars</h1>
          <Link
            href="/seminars/new"
            onClick={handleHostClick}
            className="rounded-lg px-5 py-3 text-[13.5px] font-semibold"
            style={{ background: "var(--violet)", color: "var(--ink-strong)" }}
          >
            Host a seminar
          </Link>
        </div>

        {seminars.isLoading && <p className="text-sm" style={{ color: "var(--dim)" }}>Loading seminars…</p>}
        {seminars.isError && <p className="text-sm" style={{ color: "var(--dim)" }}>Couldn&apos;t load seminars.</p>}
        {seminars.isSuccess && seminars.data.length === 0 && (
          <p className="text-sm" style={{ color: "var(--dim)" }}>No upcoming seminars yet.</p>
        )}

        <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2">
          {seminars.data?.map((seminar: Seminar) => (
            <Link key={seminar.id} href={`/seminars/${seminar.id}`} className="block rounded-2xl border p-5.5" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
              <span className="mb-3 inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: "var(--violet-dim)", color: "var(--violet)" }}>
                {new Date(seminar.scheduledAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
              <h3 className="mb-2 text-[17px] font-semibold">{seminar.title}</h3>
              <HostRow hostUserId={seminar.hostUserId} />
              {seminar.description && (
                <p className="mb-4 text-[13.5px]" style={{ color: "var(--dim)" }}>{seminar.description}</p>
              )}
              <div className="flex items-center justify-between border-t pt-3.5" style={{ borderColor: "var(--line)" }}>
                <span className="text-[13.5px] font-semibold" style={{ color: seminar.entryFeeCents === 0 ? "var(--dim)" : "var(--green)" }}>
                  {formatFee(seminar.entryFeeCents)}
                </span>
                <span className="rounded-lg px-4 py-2 text-[12.5px] font-semibold" style={{ background: "var(--violet)", color: "var(--ink-strong)" }}>
                  Register
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {showEligibility && <EligibilityModal onClose={() => setShowEligibility(false)} />}
    </PageTransition>
  );
}
