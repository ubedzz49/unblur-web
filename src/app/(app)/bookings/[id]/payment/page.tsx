"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card, Pill } from "@/components/scoreboard/kit";
import { Button, ButtonStatus } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useBooking } from "@/lib/queries/resolution";
import { useConfirmPayment, usePayment } from "@/lib/queries/payments";
import { isMeetingWindowOver } from "@/lib/meeting-window";

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

function PaymentRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border py-2.5 last:border-b-0">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className="text-[15px] font-extrabold">{children}</span>
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
  const [payStatus, setPayStatus] = useState<ButtonStatus>("idle");

  async function handlePay() {
    if (!payment.data || payStatus === "loading") return;
    setPayStatus("loading");
    try {
      const updated = await confirmPayment.mutateAsync(payment.data.id);
      if (updated.status === "completed") {
        setPayStatus("success");
        showToast("Payment confirmed");
      } else {
        // sandbox simulated failure -- payment stays pending/failed, let the user retry
        setPayStatus("idle");
        showToast("Payment didn't go through (sandbox) — try again.", "error");
      }
    } catch (err) {
      setPayStatus("idle");
      showToast(err instanceof Error ? err.message : "Payment failed — try again.", "error");
    }
  }

  if (booking.isLoading || (booking.isSuccess && payment.isLoading)) {
    return (
      <PageTransition>
        <section className="py-8">
          <Card className="max-w-[440px] p-5">
            <Skeleton width="60%" height={18} style={{ marginBottom: 12 }} />
            <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
            <Skeleton width="80%" height={14} style={{ marginBottom: 20 }} />
            <Skeleton width="100%" height={44} />
          </Card>
        </section>
      </PageTransition>
    );
  }

  if (booking.isError || !booking.data) {
    return (
      <section className="py-8">
        <Card className="max-w-[440px] p-5">
          <h3 className="mb-1 font-extrabold">Couldn&apos;t load this booking</h3>
          <p className="mb-3 text-sm text-muted-foreground">Something went wrong reaching the server.</p>
          <Button type="button" onClick={() => booking.refetch()}>
            Try again
          </Button>
        </Card>
      </section>
    );
  }

  if (payment.isError || !payment.data) {
    return (
      <section className="py-8">
        <Card className="max-w-[440px] p-5">
          <h3 className="mb-1 font-extrabold">Couldn&apos;t load the payment</h3>
          <p className="mb-3 text-sm text-muted-foreground">Something went wrong reaching the server.</p>
          <Button type="button" onClick={() => payment.refetch()}>
            Try again
          </Button>
        </Card>
      </section>
    );
  }

  const isCompleted = payment.data.status === "completed";
  const meetingEnded = isMeetingWindowOver(booking.data.slotAt, booking.data.durationMins);

  return (
    <PageTransition>
      <section className="py-8">
        <h1 className="mb-3.5 text-3xl font-semibold leading-tight sm:text-4xl">Booking payment</h1>

        <Card className="max-w-[440px] p-5">
          <div className="mb-5">
            <PaymentRow label="When">{formatSlot(booking.data.slotAt)}</PaymentRow>
            <PaymentRow label="Duration">
              <span className="num">{booking.data.durationMins} min</span>
            </PaymentRow>
            <PaymentRow label="Amount">
              <span className="num">{formatAmount(payment.data.amountCents)}</span>
            </PaymentRow>
            <PaymentRow label="Payment status">
              <Pill tone={isCompleted ? "gold" : "outline"}>{payment.data.status}</Pill>
            </PaymentRow>
          </div>

          {isCompleted ? (
            meetingEnded ? (
              <p className="font-bold">This meeting has ended.</p>
            ) : booking.data.joinUrl ? (
              <>
                <Button type="button" onClick={() => window.open(booking.data!.joinUrl!, "_blank", "noopener,noreferrer")}>
                  Join meeting
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  This session is recorded for quality and safety. The recording is kept for 15
                  minutes after the session ends, then deleted.
                </p>
              </>
            ) : (
              <p className="font-bold">
                Booking confirmed — you&apos;ll get the meeting link here once available.
              </p>
            )
          ) : (
            <>
              <p className="mb-3 text-sm text-muted-foreground">
                This is a sandbox payment — no real money moves, it just simulates the payment
                completing.
              </p>
              <Button
                type="button"
                status={payStatus}
                loadingLabel="Processing…"
                successLabel="Paid"
                onClick={handlePay}
              >
                Pay {formatAmount(payment.data.amountCents)} (sandbox)
              </Button>
            </>
          )}
        </Card>
      </section>
    </PageTransition>
  );
}
