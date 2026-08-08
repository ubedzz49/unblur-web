"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { useAcceptResolutionRequest, useRejectResolutionRequest } from "@/lib/queries/resolution";
import { ResolutionRequest, ResolutionRequestStatus } from "@/lib/api";

const STATUS_LABEL: Record<ResolutionRequestStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
};

const STATUS_STYLE: Record<ResolutionRequestStatus, React.CSSProperties> = {
  pending: { borderColor: "var(--line)", color: "var(--dim)" },
  accepted: { borderColor: "var(--green)", color: "var(--green)" },
  rejected: { borderColor: "var(--red)", color: "var(--red)" },
};

// The platform keeps a flat 10% of whatever the resolver quoted -- this is
// display-only copy (matching doubt-detail.html's confirm modal); the real
// platformFeeCents on the resulting Payment record is computed server-side.
const PLATFORM_FEE_RATE = 0.1;

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
  resolverName,
  onDone,
  bare,
}: {
  request: ResolutionRequest;
  resolverName?: string;
  onDone?: () => void;
  bare?: boolean;
}) {
  const { showToast } = useToast();
  const acceptRequest = useAcceptResolutionRequest();
  const rejectRequest = useRejectResolutionRequest();
  const [chosenSlot, setChosenSlot] = useState(request.proposedSlots[0]);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const isPending = request.status === "pending";
  const name = resolverName ?? "this resolver";

  async function handleConfirmAndPay() {
    if (!chosenSlot) return;
    setBusy(true);
    try {
      await acceptRequest.mutateAsync({ requestId: request.id, chosenSlot });
      showToast("Offer accepted");
      setConfirming(false);
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

  const total = formatAmount(request.amountCents);

  const body = (
    <>
      <p className="num mb-2.5 text-[13.5px]" style={{ color: "var(--dim)" }}>
        {request.durationMins} min · <span style={{ color: "var(--green)" }}>{total}</span>
      </p>

      {isPending && (
        <div className="mb-2.5">
          <label className="mb-1.5 block text-xs" style={{ color: "var(--dim)" }} htmlFor={`slot-choice-${request.id}`}>
            Choose a time
          </label>
          <select
            id={`slot-choice-${request.id}`}
            value={chosenSlot}
            onChange={(e) => setChosenSlot(e.target.value)}
            className="w-full min-h-[44px] rounded-lg border px-3 py-2.5 text-sm"
            style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--paper)" }}
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
          <span className="inline-block rounded-full border px-2.5 py-1 text-xs font-semibold" style={STATUS_STYLE[request.status]}>
            {STATUS_LABEL[request.status]}
          </span>
        </div>
      )}

      {isPending && (
        <div className="flex gap-2.5">
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirming(true)}
            className="flex-1 rounded-lg py-3 text-[13.5px] font-semibold"
            style={{ background: "var(--violet)", color: "var(--ink-strong)" }}
          >
            Accept and pay {total}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleReject}
            className="rounded-lg border px-4.5 py-3 text-[13.5px]"
            style={{ borderColor: "var(--line)", color: "var(--paper)" }}
          >
            Reject
          </button>
        </div>
      )}

      {confirming && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-5" role="dialog" aria-modal="true">
          <div className="w-full max-w-[380px] rounded-[18px] border p-7" style={{ borderColor: "var(--line)", background: "var(--surface-2)" }}>
            <h3 className="mb-3.5 text-[19px] font-semibold" style={{ fontFamily: "var(--font-fraunces)" }}>Confirm and pay</h3>
            <div className="flex justify-between border-b py-2.5 text-[13.5px]" style={{ borderColor: "var(--line)" }}>
              <span>{name}, {request.durationMins} minutes</span>
              <span>{total}</span>
            </div>
            <div className="flex justify-between border-b py-2.5 text-[13.5px]" style={{ borderColor: "var(--line)" }}>
              <span>Unblur platform fee ({Math.round(PLATFORM_FEE_RATE * 100)}%)</span>
              <span>Included</span>
            </div>
            <div className="flex justify-between py-2.5 text-[13.5px] font-bold" style={{ color: "var(--green)" }}>
              <span>Total</span>
              <span>{total}</span>
            </div>
            <p className="my-4 text-xs leading-relaxed" style={{ color: "var(--dim)" }}>
              Accepting this offer confirms the booking and charges you now — this is not just a scheduling step. Any
              other offers on this doubt remain open, but only one booking can ever be created. The call is recorded
              and automatically deleted 15 minutes after it ends unless you file a complaint in that window.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={busy}
                className="flex-1 rounded-lg border py-3 text-[13.5px]"
                style={{ borderColor: "var(--line)", color: "var(--paper)" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAndPay}
                disabled={busy}
                className="flex-1 rounded-lg py-3 text-[13.5px] font-semibold"
                style={{ background: "var(--violet)", color: "var(--ink-strong)" }}
              >
                Pay {total} and confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (bare) return body;
  return (
    <div className="mb-3 rounded-2xl border p-5" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
      {body}
    </div>
  );
}
