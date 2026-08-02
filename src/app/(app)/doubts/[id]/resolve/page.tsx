"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { Button, ButtonStatus } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { Card, SectionLabel } from "@/components/scoreboard/kit";
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
      <section className="py-8">
        <h1 className={shared.heading}>Offer to help</h1>
        <p className="mb-6 max-w-[44ch] text-sm text-muted-foreground">
          Propose a duration, price, and a few time slots. The poster can pick whichever slot
          works for them.
        </p>

        <Card className="max-w-[480px] p-4">
          <form onSubmit={handleSubmit}>
            <fieldset disabled={submitStatus === "loading"} className="m-0 border-0 p-0">
              <div className="mb-4">
                <SectionLabel>Duration</SectionLabel>
                <div className="mb-2.5 flex flex-wrap gap-2">
                  {DURATION_PRESETS.map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant={durationMins === preset ? "primary" : "secondary"}
                      style={{ width: "auto" }}
                      onClick={() => selectDurationPreset(preset)}
                    >
                      <span className="num">{preset}</span> min
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

              <div className="mb-4">
                <SectionLabel>Proposed time slots</SectionLabel>

                <div className="mb-3.5">
                  <span className="mb-1.5 block text-xs text-muted-foreground">
                    In a hurry? Send for right now, in a few minutes
                  </span>
                  <div className="flex items-end gap-2">
                    <div className="max-w-[160px] flex-1">
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
                      style={{ width: "auto" }}
                      className="mb-4"
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
                    <div key={index} className="mb-2 flex items-start gap-2">
                      <div className="flex-1">
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
