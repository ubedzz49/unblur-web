"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card } from "@/components/ui/Card";
import { Button, ButtonStatus } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { useToast } from "@/components/ui/Toast";
import { useSendResolutionRequest } from "@/lib/queries/resolution";
import shared from "../../../../shared.module.css";

const DURATION_PRESETS = [15, 30, 60];
const MIN_DURATION_MINS = 1;
const MAX_DURATION_MINS = 90;
const MAX_SLOTS = 3;
const MIN_QUICK_PICK_MINUTES = 0;
const MAX_QUICK_PICK_MINUTES = 60;

function isInFuture(isoOrLocalDateTime: string): boolean {
  if (!isoOrLocalDateTime) return false;
  const parsed = new Date(isoOrLocalDateTime);
  return !Number.isNaN(parsed.getTime()) && parsed.getTime() > Date.now();
}

// module-level so the impure Date.now() read isn't attributed to render of the
// component itself -- only ever invoked from an onClick handler, never during render
function quickPickIso(minutesFromNow: number): string {
  return new Date(Date.now() + minutesFromNow * 60 * 1000).toISOString();
}

export default function ResolveRequestPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const doubtId = params.id;
  const { showToast } = useToast();
  const sendRequest = useSendResolutionRequest();

  const [durationMins, setDurationMins] = useState(30);
  const [durationInput, setDurationInput] = useState("30");
  const [amountRupees, setAmountRupees] = useState("");
  const [slots, setSlots] = useState<string[]>([""]);
  const [quickPickInput, setQuickPickInput] = useState("");
  const [submitStatus, setSubmitStatus] = useState<ButtonStatus>("idle");

  const amountNumber = Number(amountRupees);
  // only the non-blank rows count toward "at least one valid future slot" --
  // blank rows are just unfilled inputs, not invalid ones, until submit is attempted
  const filledSlots = useMemo(() => slots.filter((s) => s.trim().length > 0), [slots]);
  const allFilledSlotsValid = filledSlots.length > 0 && filledSlots.every(isInFuture);

  const isValid =
    durationMins >= MIN_DURATION_MINS &&
    durationMins <= MAX_DURATION_MINS &&
    amountRupees.trim().length > 0 &&
    Number.isFinite(amountNumber) &&
    amountNumber > 0 &&
    allFilledSlotsValid;

  function selectDurationPreset(preset: number) {
    setDurationMins(preset);
    setDurationInput(String(preset));
  }

  // free-typed duration -- clamp silently to the allowed range rather than blocking
  // keystrokes, so a user typing "9" on the way to "90" isn't fought mid-type
  function handleDurationInputChange(raw: string) {
    setDurationInput(raw);
    const parsed = Number(raw);
    if (raw.trim().length > 0 && Number.isFinite(parsed)) {
      setDurationMins(Math.min(MAX_DURATION_MINS, Math.max(MIN_DURATION_MINS, Math.round(parsed))));
    }
  }

  function updateSlot(index: number, value: string) {
    setSlots((current) => current.map((s, i) => (i === index ? value : s)));
  }

  function addSlot() {
    setSlots((current) => (current.length >= MAX_SLOTS ? current : [...current, ""]));
  }

  function removeSlot(index: number) {
    setSlots((current) => current.filter((_, i) => i !== index));
  }

  // "in N minutes from now" quick pick -- computed fresh at click time, not baked in --
  // fills the first empty slot row so it doesn't clobber a slot the user already set,
  // falling back to slot 1 once every row is full
  function applyQuickPick(minutesFromNow: number) {
    const iso = quickPickIso(minutesFromNow);
    setSlots((current) => {
      const emptyIndex = current.findIndex((s) => s.trim().length === 0);
      const targetIndex = emptyIndex === -1 ? 0 : emptyIndex;
      return current.map((s, i) => (i === targetIndex ? iso : s));
    });
  }

  const quickPickNumber = Number(quickPickInput);
  const quickPickValid =
    quickPickInput.trim().length > 0 &&
    Number.isFinite(quickPickNumber) &&
    quickPickNumber >= MIN_QUICK_PICK_MINUTES &&
    quickPickNumber <= MAX_QUICK_PICK_MINUTES;

  function handleQuickPickApply() {
    if (!quickPickValid) return;
    applyQuickPick(Math.round(quickPickNumber));
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
                <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  {DURATION_PRESETS.map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant={durationMins === preset ? "primary" : "secondary"}
                      style={{ width: "auto" }}
                      onClick={() => selectDurationPreset(preset)}
                    >
                      {preset} min
                    </Button>
                  ))}
                </div>
                <Input
                  id="duration-custom"
                  label={`Or enter any duration (${MIN_DURATION_MINS}–${MAX_DURATION_MINS} min)`}
                  type="number"
                  step="1"
                  value={durationInput}
                  onChange={(e) => handleDurationInputChange(e.target.value)}
                  placeholder="e.g. 45"
                />
              </div>

              <Input
                id="amount"
                label="Amount (₹)"
                type="number"
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

                <div style={{ marginBottom: 14 }}>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      marginBottom: 6,
                      display: "block",
                    }}
                  >
                    In a hurry? Send for right now, in a few minutes
                  </span>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                    <div style={{ flex: 1, maxWidth: 160 }}>
                      <Input
                        id="quick-pick-minutes"
                        label={`Minutes from now (${MIN_QUICK_PICK_MINUTES}–${MAX_QUICK_PICK_MINUTES})`}
                        type="number"
                        step="1"
                        value={quickPickInput}
                        onChange={(e) => setQuickPickInput(e.target.value)}
                        placeholder="e.g. 2"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      style={{ width: "auto", marginBottom: 16 }}
                      disabled={!quickPickValid}
                      onClick={handleQuickPickApply}
                    >
                      Set
                    </Button>
                  </div>
                </div>

                {slots.map((slot, index) => {
                  const showError = slot.trim().length > 0 && !isInFuture(slot);
                  return (
                    <div key={index} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <DateTimePicker
                          label={`Slot ${index + 1}`}
                          value={slot}
                          onChange={(iso) => updateSlot(index, iso)}
                          error={showError ? "Pick a time in the future" : undefined}
                        />
                      </div>
                      {slots.length > 1 && (
                        <Button
                          type="button"
                          variant="secondary"
                          style={{ width: "auto" }}
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
