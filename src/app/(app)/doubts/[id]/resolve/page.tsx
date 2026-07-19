"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card } from "@/components/ui/Card";
import { Button, ButtonStatus } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useSendResolutionRequest } from "@/lib/queries/resolution";
import shared from "../../../../shared.module.css";

const DURATION_PRESETS = [15, 30, 60];
const MAX_SLOTS = 3;

function isInFuture(localDateTime: string): boolean {
  if (!localDateTime) return false;
  const parsed = new Date(localDateTime);
  return !Number.isNaN(parsed.getTime()) && parsed.getTime() > Date.now();
}

export default function ResolveRequestPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const doubtId = params.id;
  const { showToast } = useToast();
  const sendRequest = useSendResolutionRequest();

  const [durationMins, setDurationMins] = useState(30);
  const [amountRupees, setAmountRupees] = useState("");
  const [slots, setSlots] = useState<string[]>([""]);
  const [submitStatus, setSubmitStatus] = useState<ButtonStatus>("idle");

  const amountNumber = Number(amountRupees);
  // only the non-blank rows count toward "at least one valid future slot" --
  // blank rows are just unfilled inputs, not invalid ones, until submit is attempted
  const filledSlots = useMemo(() => slots.filter((s) => s.trim().length > 0), [slots]);
  const allFilledSlotsValid = filledSlots.length > 0 && filledSlots.every(isInFuture);

  const isValid =
    durationMins > 0 &&
    amountRupees.trim().length > 0 &&
    Number.isFinite(amountNumber) &&
    amountNumber > 0 &&
    allFilledSlotsValid;

  function updateSlot(index: number, value: string) {
    setSlots((current) => current.map((s, i) => (i === index ? value : s)));
  }

  function addSlot() {
    setSlots((current) => (current.length >= MAX_SLOTS ? current : [...current, ""]));
  }

  function removeSlot(index: number) {
    setSlots((current) => current.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || submitStatus === "loading") return;

    setSubmitStatus("loading");
    try {
      await sendRequest.mutateAsync({
        doubtId,
        durationMins,
        amountCents: Math.round(amountNumber * 100),
        proposedSlots: filledSlots.map((s) => new Date(s).toISOString()),
      });
      setSubmitStatus("success");
      showToast("Offer sent");
      router.push("/feed");
    } catch (err) {
      setSubmitStatus("idle");
      showToast(err instanceof Error ? err.message : "Couldn't send that offer — try again.", "error");
    }
  }

  return (
    <PageTransition>
      <section style={{ padding: "32px 0" }}>
        <h1 className={shared.heading}>Offer to help</h1>
        <p className={shared.muted} style={{ marginBottom: 24, maxWidth: "44ch" }}>
          Propose a duration, price, and a few time slots. The poster can pick whichever slot
          works for them.
        </p>

        <Card style={{ maxWidth: 480 }}>
          <form onSubmit={handleSubmit}>
            <fieldset disabled={submitStatus === "loading"} style={{ border: "none", padding: 0, margin: 0 }}>
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--muted)",
                    marginBottom: 6,
                    display: "block",
                  }}
                >
                  Duration
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  {DURATION_PRESETS.map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant={durationMins === preset ? "primary" : "secondary"}
                      style={{ width: "auto" }}
                      onClick={() => setDurationMins(preset)}
                    >
                      {preset} min
                    </Button>
                  ))}
                </div>
              </div>

              <Input
                id="amount"
                label="Amount (₹)"
                type="number"
                min={1}
                step="1"
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                placeholder="e.g. 200"
              />

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--muted)",
                    marginBottom: 6,
                    display: "block",
                  }}
                >
                  Proposed time slots
                </label>
                {slots.map((slot, index) => {
                  const showError = slot.trim().length > 0 && !isInFuture(slot);
                  return (
                    <div key={index} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <Input
                          id={`slot-${index}`}
                          label={`Slot ${index + 1}`}
                          type="datetime-local"
                          value={slot}
                          onChange={(e) => updateSlot(index, e.target.value)}
                          error={showError ? "Pick a time in the future" : undefined}
                        />
                      </div>
                      {slots.length > 1 && (
                        <Button
                          type="button"
                          variant="secondary"
                          style={{ width: "auto", marginTop: 22 }}
                          onClick={() => removeSlot(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  );
                })}
                {slots.length < MAX_SLOTS && (
                  <Button type="button" variant="secondary" style={{ width: "auto" }} onClick={addSlot}>
                    Add another slot
                  </Button>
                )}
              </div>
            </fieldset>

            <Button type="submit" status={submitStatus} loadingLabel="Sending…" successLabel="Sent" disabled={!isValid}>
              Send offer
            </Button>
          </form>
        </Card>
      </section>
    </PageTransition>
  );
}
