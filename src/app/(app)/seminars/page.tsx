"use client";

import Link from "next/link";
import { Lock, Trophy } from "lucide-react";
import { useSeminarEligibility, useSeminars } from "@/lib/queries/seminars";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card, Pill, LiveDot, SectionLabel } from "@/components/scoreboard/kit";

function formatFee(cents: number): string {
  return cents === 0 ? "Free" : `₹${(cents / 100).toFixed(0)}`;
}

// mirrors the tone mapping used on the GD detail page so "live"/"cancelled" read
// the same way across both flows
function toneForStatus(status: string): "live" | "danger" | "outline" {
  if (status === "live") return "live";
  if (status === "cancelled") return "danger";
  return "outline";
}

export default function SeminarsPage() {
  const seminars = useSeminars(true);
  const eligibility = useSeminarEligibility();

  return (
    <PageTransition>
      <div className="space-y-6 py-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-fluid-title">Seminars</h1>
            <p className="mt-1 text-sm text-muted-foreground">Live, paid group sessions from proven resolvers.</p>
          </div>
        </div>

        {eligibility.isSuccess && eligibility.data.canHostSeminar && (
          <Link href="/seminars/new">
            <Card interactive className="flex items-center gap-3 border-primary/40 bg-primary/5 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Trophy className="h-5 w-5" />
              </span>
              <div>
                <div className="text-sm font-semibold">Host a seminar</div>
                <div className="text-xs text-muted-foreground">You&apos;re eligible. Keep 90%.</div>
              </div>
            </Card>
          </Link>
        )}

        {eligibility.isSuccess && !eligibility.data.canHostSeminar && (
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Lock className="h-4 w-4 text-muted-foreground" /> Hosting locked
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Resolve 300+ minutes with a 3.5+ average rating to host your own seminars.
            </p>
          </Card>
        )}

        <section>
          <SectionLabel>Upcoming</SectionLabel>

          {seminars.isLoading && <p className="text-sm text-muted-foreground">Loading seminars…</p>}
          {seminars.isError && <p className="text-sm text-muted-foreground">Couldn&apos;t load seminars.</p>}
          {seminars.isSuccess && seminars.data.length === 0 && (
            <p className="text-sm text-muted-foreground">No upcoming seminars yet.</p>
          )}

          <div className="space-y-3">
            {seminars.data?.map((seminar) => (
              <Link key={seminar.id} href={`/seminars/${seminar.id}`} className="block">
                <Card interactive className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[0.95rem] font-bold leading-snug text-pretty">{seminar.title}</p>
                    <span className="num shrink-0 font-semibold text-foreground">{formatFee(seminar.entryFeeCents)}</span>
                  </div>
                  <p className="num mt-1 text-xs text-muted-foreground">
                    {new Date(seminar.scheduledAt).toLocaleString()} · {seminar.durationMins} min
                  </p>
                  <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                    <Pill tone={toneForStatus(seminar.status)}>
                      {seminar.status === "live" && <LiveDot />}
                      {seminar.status}
                    </Pill>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
