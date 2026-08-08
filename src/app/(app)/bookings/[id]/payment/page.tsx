"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useBooking, useCancelBooking, useSubmitRating } from "@/lib/queries/resolution";
import { useConfirmPayment, usePayment } from "@/lib/queries/payments";
import { usePublicUser } from "@/lib/queries/users";
import { isMeetingWindowOver } from "@/lib/meeting-window";
import type { ButtonStatus } from "@/components/ui/Button";

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

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between border-b py-3 text-sm last:border-b-0" style={{ borderColor: "var(--line)" }}>
      <span style={{ color: "var(--dim)" }}>{label}</span>
      <span className="num font-medium">{children}</span>
    </div>
  );
}

function RatingCard({ bookingId, resolverName }: { bookingId: string; resolverName: string }) {
  const { showToast } = useToast();
  const submitRating = useSubmitRating();
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (rating < 1 || rating > 5 || submitRating.isPending) return;
    try {
      await submitRating.mutateAsync({ bookingId, rating, feedbackText: feedbackText || undefined });
      setSubmitted(true);
      showToast("Thanks for rating this session");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't submit that rating — try again.", "error");
    }
  }

  return (
    <div className="mt-9">
      <div className="mb-4 text-[13px] font-medium uppercase tracking-wide" style={{ color: "var(--dim)" }}>
        After the session
      </div>
      <div className="rounded-2xl border p-6" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
        {submitted ? (
          <p className="text-center text-sm font-semibold">You rated this session {rating}★. Thanks!</p>
        ) : (
          <>
            <p className="text-center text-sm" style={{ color: "var(--dim)" }}>How did the session go with {resolverName}?</p>
            <div className="my-4.5 flex justify-center gap-2" role="group" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={rating >= n}
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                  onClick={() => setRating(n)}
                  className="text-[34px] leading-none"
                  style={{ color: rating >= n ? "var(--gold)" : "var(--line)" }}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              aria-label="Optional feedback"
              placeholder={`Optional feedback for ${resolverName}`}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="mb-4 min-h-[80px] w-full rounded-lg border p-3.5 text-sm"
              style={{ borderColor: "var(--line)", background: "var(--surface-2)", color: "var(--paper)" }}
            />
            <button
              type="button"
              disabled={rating < 1 || rating > 5 || submitRating.isPending}
              onClick={handleSubmit}
              className="w-full rounded-lg py-3.5 text-[14.5px] font-semibold disabled:opacity-50"
              style={{ background: "var(--violet)", color: "var(--ink-strong)" }}
            >
              Submit rating
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function BookingPaymentPage() {
  const params = useParams<{ id: string }>();
  const bookingId = params.id;
  const { showToast } = useToast();

  const booking = useBooking(bookingId);
  const payment = usePayment(booking.data?.paymentId);
  const confirmPayment = useConfirmPayment();
  const cancelBooking = useCancelBooking();
  const resolver = usePublicUser(booking.data?.resolverUserId);
  const [payStatus, setPayStatus] = useState<ButtonStatus>("idle");
  const [cancelling, setCancelling] = useState(false);

  async function handlePay() {
    if (!payment.data || payStatus === "loading") return;
    setPayStatus("loading");
    try {
      const updated = await confirmPayment.mutateAsync(payment.data.id);
      if (updated.status === "completed") {
        setPayStatus("success");
        showToast("Payment confirmed");
      } else {
        setPayStatus("idle");
        showToast("Payment didn't go through (sandbox) — try again.", "error");
      }
    } catch (err) {
      setPayStatus("idle");
      showToast(err instanceof Error ? err.message : "Payment failed — try again.", "error");
    }
  }

  async function handleCancel() {
    if (!booking.data || cancelling) return;
    setCancelling(true);
    try {
      await cancelBooking.mutateAsync(booking.data.id);
      showToast("Booking cancelled, full refund issued");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't cancel that booking — try again.", "error");
    } finally {
      setCancelling(false);
    }
  }

  if (booking.isLoading || (booking.isSuccess && payment.isLoading)) {
    return (
      <PageTransition>
        <section className="mx-auto max-w-[640px] py-10 px-5">
          <div className="max-w-[440px] rounded-2xl border p-6" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
            <Skeleton width="60%" height={18} style={{ marginBottom: 12 }} />
            <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
            <Skeleton width="80%" height={14} style={{ marginBottom: 20 }} />
            <Skeleton width="100%" height={44} />
          </div>
        </section>
      </PageTransition>
    );
  }

  if (booking.isError || !booking.data) {
    return (
      <section className="mx-auto max-w-[640px] py-10 px-5">
        <div className="max-w-[440px] rounded-2xl border p-6" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
          <h3 className="mb-1 font-bold">Couldn&apos;t load this booking</h3>
          <p className="mb-3 text-sm" style={{ color: "var(--dim)" }}>Something went wrong reaching the server.</p>
          <button type="button" onClick={() => booking.refetch()} className="rounded-lg px-4 py-2.5 text-sm font-semibold" style={{ background: "var(--violet)", color: "var(--ink-strong)" }}>
            Try again
          </button>
        </div>
      </section>
    );
  }

  if (payment.isError || !payment.data) {
    return (
      <section className="mx-auto max-w-[640px] py-10 px-5">
        <div className="max-w-[440px] rounded-2xl border p-6" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
          <h3 className="mb-1 font-bold">Couldn&apos;t load the payment</h3>
          <p className="mb-3 text-sm" style={{ color: "var(--dim)" }}>Something went wrong reaching the server.</p>
          <button type="button" onClick={() => payment.refetch()} className="rounded-lg px-4 py-2.5 text-sm font-semibold" style={{ background: "var(--violet)", color: "var(--ink-strong)" }}>
            Try again
          </button>
        </div>
      </section>
    );
  }

  const isCompleted = payment.data.status === "completed";
  const meetingEnded = isMeetingWindowOver(booking.data.slotAt, booking.data.durationMins);
  const resolverName = resolver.data?.name ?? "your resolver";

  return (
    <PageTransition>
      <section className="mx-auto max-w-[640px] px-5 pb-24 pt-12">
        {isCompleted && (
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px]"
            style={{ background: "rgba(127,217,154,0.12)", color: "var(--green)" }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--green)" }} />
            Booking confirmed
          </div>
        )}
        <h1 className="mb-2 text-[26px] font-semibold" style={{ fontFamily: "var(--font-fraunces)" }}>
          {isCompleted ? `${resolverName} is expecting you` : "Confirm your booking"}
        </h1>
        <p className="mb-8 text-[14.5px]" style={{ color: "var(--dim)" }}>{booking.data.durationMins} minute session</p>

        <div className="mb-5 rounded-2xl border p-6" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
          <DetailRow label="Resolver">{resolverName}</DetailRow>
          <DetailRow label="Duration">{booking.data.durationMins} minutes</DetailRow>
          <DetailRow label="Amount">{formatAmount(payment.data.amountCents)}</DetailRow>
          <DetailRow label="Starts">{formatSlot(booking.data.slotAt)}</DetailRow>
          <DetailRow label="Payment status">{payment.data.status}</DetailRow>
        </div>

        {isCompleted ? (
          <>
            {!meetingEnded && (
              <div
                className="mb-5 flex items-center gap-2.5 rounded-xl border px-4.5 py-3.5 text-[12.5px]"
                style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--dim)" }}
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--red)" }} />
                This session is recorded for quality and safety and automatically deleted 15 minutes after it ends.
              </div>
            )}

            {meetingEnded ? (
              <p className="font-semibold">This meeting has ended.</p>
            ) : booking.data.joinUrl ? (
              <>
                <button
                  type="button"
                  onClick={() => window.open(booking.data!.joinUrl!, "_blank", "noopener,noreferrer")}
                  className="mb-3 w-full rounded-[10px] py-4 text-[15px] font-semibold"
                  style={{ background: "var(--violet)", color: "var(--ink-strong)" }}
                >
                  Join meeting
                </button>
                {booking.data.status === "scheduled" && (
                  <button
                    type="button"
                    disabled={cancelling}
                    onClick={handleCancel}
                    className="w-full rounded-[10px] border py-3.5 text-sm disabled:opacity-50"
                    style={{ borderColor: "var(--line)", color: "var(--paper)" }}
                  >
                    Cancel booking, full refund
                  </button>
                )}
              </>
            ) : (
              <p className="font-semibold">You&apos;re all set — the meeting link will appear here once it&apos;s ready.</p>
            )}

            {booking.data.status === "completed" && <RatingCard bookingId={booking.data.id} resolverName={resolverName} />}
          </>
        ) : (
          <>
            <p className="mb-4 text-sm" style={{ color: "var(--dim)" }}>
              This is a sandbox payment — no real money moves, it just simulates the payment completing.
            </p>
            <button
              type="button"
              disabled={payStatus === "loading"}
              onClick={handlePay}
              className="w-full rounded-[10px] py-4 text-[15px] font-semibold disabled:opacity-60"
              style={{ background: "var(--violet)", color: "var(--ink-strong)" }}
            >
              {payStatus === "loading" ? "Processing…" : `Pay ${formatAmount(payment.data.amountCents)} (sandbox)`}
            </button>
          </>
        )}
      </section>
    </PageTransition>
  );
}
