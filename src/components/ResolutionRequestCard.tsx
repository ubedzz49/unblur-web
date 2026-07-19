"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { useAcceptResolutionRequest, useRejectResolutionRequest } from "@/lib/queries/resolution";
import { ResolutionRequest } from "@/lib/api";

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
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 10 }}>
        {request.durationMins} min · {formatAmount(request.amountCents)}
      </p>

      {isPending && (
        <div style={{ marginBottom: 10 }}>
          <label
            style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}
            htmlFor={`slot-choice-${request.id}`}
          >
            Choose a time
          </label>
          <select
            id={`slot-choice-${request.id}`}
            value={chosenSlot}
            onChange={(e) => setChosenSlot(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 4, border: "1px solid var(--line)" }}
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
        <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 10, textTransform: "capitalize" }}>
          {request.status}
        </p>
      )}

      {isPending && (
        <div style={{ display: "flex", gap: 8 }}>
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
  return <Card style={{ marginBottom: 12 }}>{body}</Card>;
}
