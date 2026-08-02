"use client";

import Link from "next/link";
import { useGdEligibility, useGds } from "@/lib/queries/gds";
import { Card, LiveDot, Pill, SectionLabel } from "@/components/scoreboard/kit";
import { Button } from "@/components/ui/Button";
import { PageTransition } from "@/components/ui/PageTransition";
import type { Gd } from "@/lib/api";

function formatFee(cents: number): string {
  return cents === 0 ? "Free" : `₹${(cents / 100).toFixed(0)}`;
}

function statusTone(status: Gd["status"]): "outline" | "live" | "neutral" | "danger" {
  if (status === "live") return "live";
  if (status === "cancelled") return "danger";
  if (status === "completed") return "neutral";
  return "outline";
}

export default function GdsPage() {
  const gds = useGds(true);
  const eligibility = useGdEligibility();

  return (
    <PageTransition>
      <div className="space-y-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-fluid-title">Group discussions</h1>
          {eligibility.data?.canOrganizeGD && (
            <Link href="/gds/new">
              <Button>Organize a GD</Button>
            </Link>
          )}
        </div>

        {eligibility.isSuccess && !eligibility.data.canAttendGD && (
          <p className="text-sm text-muted-foreground">
            Attend a GD once you&apos;ve listened for 50+ minutes. Organize one once you&apos;ve resolved 100+ minutes.
          </p>
        )}

        {gds.isLoading && <p className="text-sm text-muted-foreground">Loading GDs…</p>}
        {gds.isError && <p className="text-sm text-muted-foreground">Couldn&apos;t load GDs.</p>}
        {gds.isSuccess && gds.data.length === 0 && (
          <p className="text-sm text-muted-foreground">No upcoming GDs yet.</p>
        )}

        <section>
          <SectionLabel>Discover</SectionLabel>
          <div className="space-y-3">
            {gds.data?.map((gd) => (
              <Link key={gd.id} href={`/gds/${gd.id}`}>
                <Card interactive className="p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Pill tone={statusTone(gd.status)}>
                      {gd.status === "live" && <LiveDot />}
                      {gd.status.replace("_", " ")}
                    </Pill>
                    <Pill tone={gd.entryFeeCents === 0 ? "neutral" : "gold"}>
                      <span className="num">{formatFee(gd.entryFeeCents)}</span>
                    </Pill>
                  </div>

                  <h3 className="text-pretty text-[0.95rem] font-bold leading-snug">{gd.topic}</h3>

                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(gd.scheduledAt).toLocaleString()} ·{" "}
                    <span className="num">{gd.durationMins}</span> min
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
