"use client";

import Link from "next/link";
import { useSeminarEligibility, useSeminars } from "@/lib/queries/seminars";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { LiveDot } from "@/components/ui/LiveDot";
import { PageTransition } from "@/components/ui/PageTransition";
import shared from "../../shared.module.css";
import styles from "./page.module.css";

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
      <section style={{ padding: "32px 0" }}>
        <div className={styles.header}>
          <h1 className={shared.heading}>Seminars</h1>
          {eligibility.data?.canHostSeminar && (
            <Link href="/seminars/new">
              <Button>Host a seminar</Button>
            </Link>
          )}
        </div>

        {eligibility.isSuccess && !eligibility.data.canHostSeminar && (
          <p className={`${shared.muted} ${styles.hint}`}>
            Host a seminar once you&apos;ve resolved 300+ minutes with a 3.5+ average rating.
          </p>
        )}

        {seminars.isLoading && <p className={shared.muted}>Loading seminars…</p>}
        {seminars.isError && <p className={shared.muted}>Couldn&apos;t load seminars.</p>}
        {seminars.isSuccess && seminars.data.length === 0 && <p className={shared.muted}>No upcoming seminars yet.</p>}

        <div className={styles.list}>
          {seminars.data?.map((seminar) => (
            <Link key={seminar.id} href={`/seminars/${seminar.id}`} className={styles.itemLink}>
              <Card>
                <div className={styles.itemTop}>
                  <div>
                    <p className={styles.title}>{seminar.title}</p>
                    <p className={`${shared.muted} num ${styles.meta}`}>
                      {new Date(seminar.scheduledAt).toLocaleString()} · {seminar.durationMins} min
                    </p>
                  </div>
                  <p className={`${styles.fee} num`}>{formatFee(seminar.entryFeeCents)}</p>
                </div>
                <div className={styles.itemFooter}>
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
    </PageTransition>
  );
}
