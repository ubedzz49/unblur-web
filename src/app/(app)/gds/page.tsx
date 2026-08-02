"use client";

import Link from "next/link";
import { useGdEligibility, useGds } from "@/lib/queries/gds";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { LiveDot } from "@/components/ui/LiveDot";
import { PageTransition } from "@/components/ui/PageTransition";
import shared from "../../shared.module.css";
import styles from "./page.module.css";
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
      <section style={{ padding: "32px 0" }}>
        <div className={styles.header}>
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

        <div className={styles.list}>
          {gds.data?.map((gd) => (
            <Link key={gd.id} href={`/gds/${gd.id}`} className={styles.link}>
              <Card>
                <div className={styles.statusRow}>
                  <Pill tone={statusTone(gd.status)}>
                    {gd.status === "live" && <LiveDot />}
                    {gd.status.replace("_", " ")}
                  </Pill>
                </div>
                <div className={styles.row}>
                  <div>
                    <p className={styles.topic}>{gd.topic}</p>
                    <p className={styles.meta}>
                      {new Date(gd.scheduledAt).toLocaleString()} ·{" "}
                      <span className="num">{gd.durationMins}</span> min
                    </p>
                  </div>
                  <div className={styles.feeCol}>
                    <Pill tone={gd.entryFeeCents === 0 ? "neutral" : "gold"}>
                      <span className="num">{formatFee(gd.entryFeeCents)}</span>
                    </Pill>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </PageTransition>
  );
}
