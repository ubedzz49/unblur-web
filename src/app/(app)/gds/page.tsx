"use client";

import Link from "next/link";
import { useGdEligibility, useGds } from "@/lib/queries/gds";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageTransition } from "@/components/ui/PageTransition";
import shared from "../../shared.module.css";

function formatFee(cents: number): string {
  return cents === 0 ? "Free" : `₹${(cents / 100).toFixed(0)}`;
}

export default function GdsPage() {
  const gds = useGds(true);
  const eligibility = useGdEligibility();

  return (
    <PageTransition>
      <section style={{ padding: "32px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h1 className={shared.heading}>Group discussions</h1>
          {eligibility.data?.canOrganizeGD && (
            <Link href="/gds/new">
              <Button>Organize a GD</Button>
            </Link>
          )}
        </div>

        {eligibility.isSuccess && !eligibility.data.canAttendGD && (
          <p className={shared.muted} style={{ marginBottom: 16 }}>
            Attend a GD once you&apos;ve listened for 50+ minutes. Organize one once you&apos;ve resolved 100+ minutes.
          </p>
        )}

        {gds.isLoading && <p className={shared.muted}>Loading GDs…</p>}
        {gds.isError && <p className={shared.muted}>Couldn&apos;t load GDs.</p>}
        {gds.isSuccess && gds.data.length === 0 && <p className={shared.muted}>No upcoming GDs yet.</p>}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {gds.data?.map((gd) => (
            <Link key={gd.id} href={`/gds/${gd.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontWeight: 700 }}>{gd.topic}</p>
                    <p className={shared.muted}>
                      {new Date(gd.scheduledAt).toLocaleString()} · {gd.durationMins} min
                    </p>
                  </div>
                  <p style={{ fontWeight: 700 }}>{formatFee(gd.entryFeeCents)}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </PageTransition>
  );
}
