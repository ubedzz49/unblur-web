"use client";

import Link from "next/link";
import { useSeminarEligibility, useSeminars } from "@/lib/queries/seminars";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageTransition } from "@/components/ui/PageTransition";
import shared from "../../shared.module.css";

function formatFee(cents: number): string {
  return cents === 0 ? "Free" : `₹${(cents / 100).toFixed(0)}`;
}

export default function SeminarsPage() {
  const seminars = useSeminars(true);
  const eligibility = useSeminarEligibility();

  return (
    <PageTransition>
      <section style={{ padding: "32px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h1 className={shared.heading}>Seminars</h1>
          {eligibility.data?.canHostSeminar && (
            <Link href="/seminars/new">
              <Button>Host a seminar</Button>
            </Link>
          )}
        </div>

        {eligibility.isSuccess && !eligibility.data.canHostSeminar && (
          <p className={shared.muted} style={{ marginBottom: 16 }}>
            Host a seminar once you&apos;ve resolved 300+ minutes with a 3.5+ average rating.
          </p>
        )}

        {seminars.isLoading && <p className={shared.muted}>Loading seminars…</p>}
        {seminars.isError && <p className={shared.muted}>Couldn&apos;t load seminars.</p>}
        {seminars.isSuccess && seminars.data.length === 0 && <p className={shared.muted}>No upcoming seminars yet.</p>}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {seminars.data?.map((seminar) => (
            <Link key={seminar.id} href={`/seminars/${seminar.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontWeight: 700 }}>{seminar.title}</p>
                    <p className={shared.muted}>
                      {new Date(seminar.scheduledAt).toLocaleString()} · {seminar.durationMins} min
                    </p>
                  </div>
                  <p style={{ fontWeight: 700 }}>{formatFee(seminar.entryFeeCents)}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </PageTransition>
  );
}
