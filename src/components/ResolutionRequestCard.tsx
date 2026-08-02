"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, Pill } from "@/components/scoreboard/kit";
import { useToast } from "@/components/ui/Toast";
import { useAcceptResolutionRequest, useRejectResolutionRequest } from "@/lib/queries/resolution";
import { ResolutionRequest, ResolutionRequestStatus } from "@/lib/api";

const STATUS_TONE: Record<ResolutionRequestStatus, "outline" | "gold" | "danger"> = {
  pending: "outline",
  accepted: "gold",
  rejected: "danger",
};

function formatAmount(amountCents: number): string {
  return `₹${(amountCents / 100).toFixed(0)}`;
}

function formatSlot(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// pending-request card with the slot-choice + accept/reject flow -- shared by the
// requests page and the feed's per-doubt requests modal so the accept/reject mutation
// logic only lives in one place
export function ResolutionRequestCard({
  request,
  onDone,
  bare,
}: {
  request: ResolutionRequest;
  onDone?: () => void;
  bare?: boolean;
}) {
  const { showToast } = useToast();
  const acceptRequest = useAcceptResolutionRequest();
  const rejectRequest = useRejectResolutionRequest();
  const [chosenSlot, setChosenSlot] = useState(request.proposedSlots[0]);
  const [busy, setBusy] = useState(false);

  const isPending = request.status === "pending";

  async function handleAccept() {
    if (!chosenSlot) return;
    setBusy(true);
    try {
      await acceptRequest.mutateAsync({ requestId: request.id, chosenSlot });
      showToast("Offer accepted");
      onDone?.();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't accept that offer — try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    setBusy(true);
    try {
      await rejectRequest.mutateAsync(request.id);
      showToast("Offer rejected");
      onDone?.();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't reject that offer — try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  const body = (
    <>
      <p className="num mb-2.5 text-sm text-muted-foreground">
        {request.durationMins} min · {formatAmount(request.amountCents)}
      </p>

      {isPending && (
        <div className="mb-2.5">
          <label className="mb-1.5 block text-xs text-muted-foreground" htmlFor={`slot-choice-${request.id}`}>
            Choose a time
          </label>
          <select
            id={`slot-choice-${request.id}`}
            value={chosenSlot}
            onChange={(e) => setChosenSlot(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-border bg-card px-3 py-2.5 text-base text-foreground"
          >
            {request.proposedSlots.map((slot) => (
              <option key={slot} value={slot}>
                {formatSlot(slot)}
              </option>
            ))}
          </select>
        </div>
      )}

      {!isPending && (
        <div className="mb-2.5">
          <Pill tone={STATUS_TONE[request.status]}>{request.status}</Pill>
        </div>
      )}

      {isPending && (
        <div className="flex gap-2">
          <Button type="button" style={{ width: "auto" }} disabled={busy} onClick={handleAccept}>
            Accept
          </Button>
          <Button type="button" variant="secondary" style={{ width: "auto" }} disabled={busy} onClick={handleReject}>
            Reject
          </Button>
        </div>
      )}
    </>
  );

  if (bare) return body;
  return <Card className="mb-3 p-4">{body}</Card>;
}
