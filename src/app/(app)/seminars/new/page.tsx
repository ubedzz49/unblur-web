"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateSeminar, useSeminarEligibility } from "@/lib/queries/seminars";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { PageTransition } from "@/components/ui/PageTransition";
import { useToast } from "@/components/ui/Toast";
import shared from "../../../shared.module.css";
import styles from "./page.module.css";

export default function NewSeminarPage() {
  const router = useRouter();
  const toast = useToast();
  const eligibility = useSeminarEligibility();
  const createSeminar = useCreateSeminar();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMins, setDurationMins] = useState("60");
  const [entryFeeRupees, setEntryFeeRupees] = useState("0");

  if (eligibility.isSuccess && !eligibility.data.canHostSeminar) {
    return (
      <PageTransition>
        <section style={{ padding: "32px 0" }}>
          <h1 className={shared.heading}>Host a seminar</h1>
          <Card>
            <p className={`${shared.muted} ${styles.gateHint}`}>
              You need <span className="num">300+</span> minutes resolved and a{" "}
              <span className="num">3.5+</span> average rating to host a seminar.
            </p>
          </Card>
        </section>
      </PageTransition>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !scheduledAt) {
      toast.showToast("Title and date/time are required", "error");
      return;
    }
    try {
      const seminar = await createSeminar.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        scheduledAt,
        durationMins: Number(durationMins),
        entryFeeCents: Math.round(Number(entryFeeRupees) * 100),
      });
      toast.showToast("Seminar created", "success");
      router.push(`/seminars/${seminar.id}`);
    } catch (err) {
      toast.showToast(err instanceof Error ? err.message : "Couldn't create seminar", "error");
    }
  }

  return (
    <PageTransition>
      <section style={{ padding: "32px 0" }}>
        <h1 className={shared.heading}>Host a seminar</h1>
        <Card>
          <form onSubmit={handleSubmit} className={styles.form}>
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <Textarea label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
            <DateTimePicker label="Scheduled at" value={scheduledAt} onChange={setScheduledAt} />
            <Input
              label="Duration (minutes)"
              type="number"
              min={1}
              value={durationMins}
              onChange={(e) => setDurationMins(e.target.value)}
            />
            <Input
              label="Entry fee (₹, 0 for free)"
              type="number"
              min={0}
              value={entryFeeRupees}
              onChange={(e) => setEntryFeeRupees(e.target.value)}
            />
            <Button type="submit" status={createSeminar.isPending ? "loading" : "idle"} loadingLabel="Creating…">
              Create seminar
            </Button>
          </form>
        </Card>
      </section>
    </PageTransition>
  );
}
