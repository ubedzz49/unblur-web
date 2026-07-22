"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card } from "@/components/ui/Card";
import { Button, ButtonStatus } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useBooking } from "@/lib/queries/resolution";
import { useConfirmPayment, usePayment } from "@/lib/queries/payments";
import shared from "../../../../shared.module.css";

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
        <section style={{ padding: "32px 0" }}>
          <Card style={{ maxWidth: 440 }}>
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
      <section style={{ padding: "32px 0" }}>
        <Card style={{ maxWidth: 440 }}>
          <h3>Couldn&apos;t load this booking</h3>
          <p className={shared.muted}>Something went wrong reaching the server.</p>
          <Button type="button" onClick={() => booking.refetch()}>
            Try again
          </Button>
        </Card>
      </section>
    );
  }

  if (payment.isError || !payment.data) {
    return (
      <section style={{ padding: "32px 0" }}>
        <Card style={{ maxWidth: 440 }}>
          <h3>Couldn&apos;t load the payment</h3>
          <p className={shared.muted}>Something went wrong reaching the server.</p>
          <Button type="button" onClick={() => payment.refetch()}>
            Try again
          </Button>
        </Card>
      </section>
    );
  }

  const isCompleted = payment.data.status === "completed";

  return (
    <PageTransition>
      <section style={{ padding: "32px 0" }}>
        <h1 className={shared.heading}>Booking payment</h1>

        <Card style={{ maxWidth: 440 }}>
          <p className={shared.muted} style={{ marginBottom: 4 }}>When</p>
          <p style={{ fontWeight: 800, marginBottom: 16 }}>{formatSlot(booking.data.slotAt)}</p>

          <p className={shared.muted} style={{ marginBottom: 4 }}>Duration</p>
          <p style={{ fontWeight: 800, marginBottom: 16 }}>{booking.data.durationMins} min</p>

          <p className={shared.muted} style={{ marginBottom: 4 }}>Amount</p>
          <p style={{ fontWeight: 800, marginBottom: 20 }}>{formatAmount(payment.data.amountCents)}</p>

          {isCompleted ? (
            booking.data.joinUrl ? (
              <a href={booking.data.joinUrl} target="_blank" rel="noopener noreferrer">
                <Button type="button">Join meeting</Button>
              </a>
            ) : (
              <p style={{ fontWeight: 700 }}>
                Booking confirmed — you&apos;ll get the meeting link here once available.
              </p>
            )
          ) : (
            <>
              <p className={shared.muted} style={{ marginBottom: 12 }}>
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
