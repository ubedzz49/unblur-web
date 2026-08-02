"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateGd, useGdEligibility } from "@/lib/queries/gds";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pill } from "@/components/ui/Pill";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { PageTransition } from "@/components/ui/PageTransition";
import { useToast } from "@/components/ui/Toast";
import shared from "../../../shared.module.css";
import styles from "./page.module.css";

const ORGANIZER_FEE_RUPEES = 300; // matches GD_ORGANIZER_FEE_CENTS default on the service

export default function NewGdPage() {
  const router = useRouter();
  const toast = useToast();
  const eligibility = useGdEligibility();
  const createGd = useCreateGd();

  const [topic, setTopic] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMins, setDurationMins] = useState("30");
  const [entryFeeRupees, setEntryFeeRupees] = useState("0");

  if (eligibility.isSuccess && !eligibility.data.canOrganizeGD) {
    return (
      <PageTransition>
        <section style={{ padding: "32px 0" }}>
          <h1 className={shared.heading}>Organize a GD</h1>
          <p className={shared.muted}>You need 100+ minutes resolved to organize a GD.</p>
        </section>
      </PageTransition>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim() || !scheduledAt) {
      toast.showToast("Topic and date/time are required", "error");
      return;
    }
    try {
      const gd = await createGd.mutateAsync({
        topic: topic.trim(),
        scheduledAt,
        durationMins: Number(durationMins),
        entryFeeCents: Math.round(Number(entryFeeRupees) * 100),
      });
      toast.showToast("GD created (organizer fee charged, sandbox)", "success");
      router.push(`/gds/${gd.id}`);
    } catch (err) {
      toast.showToast(err instanceof Error ? err.message : "Couldn't create GD", "error");
    }
  }

  return (
    <PageTransition>
      <section style={{ padding: "32px 0" }}>
        <h1 className={shared.heading}>Organize a GD</h1>
        <div className={styles.feeNotice}>
          <Pill tone="gold">
            <span className="num">₹{ORGANIZER_FEE_RUPEES}</span> platform fee
          </Pill>
          <p className={styles.feeNoticeText}>Charged up front (sandbox). Entry fees from participants go to you.</p>
        </div>
        <Card>
          <form onSubmit={handleSubmit} className={styles.form}>
            <Input label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)} required />
            <DateTimePicker label="Scheduled at" value={scheduledAt} onChange={setScheduledAt} />
            <Input
              label="Duration (minutes)"
              type="number"
              min={1}
              value={durationMins}
              onChange={(e) => setDurationMins(e.target.value)}
            />
            <Input
              label="Entry fee per participant (₹, 0 for free)"
              type="number"
              min={0}
              value={entryFeeRupees}
              onChange={(e) => setEntryFeeRupees(e.target.value)}
            />
            <Button type="submit" status={createGd.isPending ? "loading" : "idle"} loadingLabel="Creating…">
              Create GD
            </Button>
          </form>
        </Card>

        <Card className={styles.rulesCard}>
          <div className={styles.rulesList}>
            <p>Up to 3 people can speak at once.</p>
            <p>Each participant gets at most 1/10th of the total duration to speak.</p>
          </div>
        </Card>
      </section>
    </PageTransition>
  );
}
