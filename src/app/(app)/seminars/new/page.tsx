"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateSeminar, useSeminarEligibility } from "@/lib/queries/seminars";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { PageTransition } from "@/components/ui/PageTransition";
import { useToast } from "@/components/ui/Toast";
import { Card } from "@/components/scoreboard/kit";

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
        <div className="space-y-6 py-8">
          <h1 className="text-fluid-title">Host a seminar</h1>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">
              You need <span className="num font-semibold text-foreground">300+</span> minutes resolved and a{" "}
              <span className="num font-semibold text-foreground">3.5+</span> average rating to host a seminar.
            </p>
          </Card>
        </div>
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
      <div className="space-y-6 py-8">
        <h1 className="text-fluid-title">Host a seminar</h1>
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
      </div>
    </PageTransition>
  );
}
