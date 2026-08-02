"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateGd, useGdEligibility } from "@/lib/queries/gds";
import { Card, Pill, SectionLabel } from "@/components/scoreboard/kit";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { PageTransition } from "@/components/ui/PageTransition";
import { useToast } from "@/components/ui/Toast";

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
        <div className="space-y-2 py-8">
          <h1 className="text-fluid-title">Organize a GD</h1>
          <p className="text-sm text-muted-foreground">You need 100+ minutes resolved to organize a GD.</p>
        </div>
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
      <div className="space-y-6 py-8">
        <h1 className="text-fluid-title">Organize a GD</h1>

        <div className="flex flex-wrap items-center gap-2.5">
          <Pill tone="gold">
            <span className="num">₹{ORGANIZER_FEE_RUPEES}</span> platform fee
          </Pill>
          <p className="text-sm text-muted-foreground">
            Charged up front (sandbox). Entry fees from participants go to you.
          </p>
        </div>

        <Card className="p-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

        <Card className="p-4">
          <SectionLabel>Rules</SectionLabel>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p>Up to 3 people can speak at once.</p>
            <p>Each participant gets at most 1/10th of the total duration to speak.</p>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
