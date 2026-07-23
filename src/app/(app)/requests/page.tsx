"use client";

import Link from "next/link";
import { useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useMe } from "@/lib/queries/users";
import { useMyDoubts } from "@/lib/queries/doubts";
import {
  useCancelBooking,
  useCompleteBooking,
  useMyBookings,
  useResolutionRequests,
  useResolutionRequestsForDoubt,
  useSubmitRating,
} from "@/lib/queries/resolution";
import { ResolutionRequestCard } from "@/components/ResolutionRequestCard";
import { MeetingModal } from "@/components/MeetingModal";
import { ApiError, Booking, BookingStatus, Doubt, ResolutionRequest } from "@/lib/api";
import { relativeTime } from "@/lib/relative-time";
import shared from "../../shared.module.css";

type Tab = "forMyDoubts" | "sentByMe" | "bookings";

const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
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

function IncomingRequestsForDoubt({ doubt }: { doubt: Doubt }) {
  const requests = useResolutionRequestsForDoubt(doubt.id);

  const pending = (requests.data ?? []).filter((r) => r.status === "pending");
  if (requests.isLoading) return <Skeleton height={60} style={{ marginBottom: 12 }} />;
  if (requests.isError || pending.length === 0) return null;

  return (
    <>
      {pending.map((request) => (
        <Card key={request.id} style={{ marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>{doubt.title}</h3>
          <ResolutionRequestCard request={request} bare />
        </Card>
      ))}
    </>
  );
}

function SentRequestRow({ request }: { request: ResolutionRequest }) {
  return (
    <Card style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontWeight: 800, fontSize: 14 }}>
          {request.durationMins} min · {formatAmount(request.amountCents)}
        </span>
        <span className={shared.muted} style={{ textTransform: "capitalize" }}>
          {request.status}
        </span>
      </div>
      <p className={shared.muted}>Sent {relativeTime(request.createdAt)}</p>
    </Card>
  );
}

// poster rates 1-5 stars after a session completes. the API has no "already rated" flag on the
// booking, so we just show the form whenever the booking is completed and handle a 409 (duplicate
// rate attempt) as its own case rather than trying to guess client-side whether it's been rated.
function RatingPrompt({ bookingId }: { bookingId: string }) {
  const { showToast } = useToast();
  const submitRating = useSubmitRating();
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [outcome, setOutcome] = useState<"pending" | "rated" | "already-rated">("pending");

  async function handleSubmit() {
    if (rating < 1 || rating > 5) return;
    try {
      await submitRating.mutateAsync({ bookingId, rating, feedbackText: feedbackText || undefined });
      setOutcome("rated");
      showToast("Thanks for rating this session");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setOutcome("already-rated");
        showToast("You've already rated this session");
      } else {
        showToast(err instanceof Error ? err.message : "Couldn't submit that rating — try again.", "error");
      }
    }
  }

  if (outcome === "rated") {
    return <p style={{ fontWeight: 700, marginTop: 10 }}>You rated this session {rating}★</p>;
  }
  if (outcome === "already-rated") {
    return <p className={shared.muted} style={{ marginTop: 10 }}>You&apos;ve already rated this session.</p>;
  }

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
      <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Rate this session</p>
      <div role="group" aria-label="Rating" style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={rating >= n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onClick={() => setRating(n)}
            style={{
              fontSize: 20,
              lineHeight: 1,
              color: rating >= n ? "var(--accent)" : "var(--muted)",
              padding: 4,
            }}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        aria-label="Feedback (optional)"
        placeholder="Feedback (optional)"
        value={feedbackText}
        onChange={(e) => setFeedbackText(e.target.value)}
        rows={2}
        style={{ width: "100%", marginBottom: 8, fontFamily: "inherit", fontSize: 13, padding: 8 }}
      />
      <Button
        type="button"
        style={{ width: "auto" }}
        disabled={rating < 1 || rating > 5 || submitRating.isPending}
        onClick={handleSubmit}
      >
        Submit rating
      </Button>
    </div>
  );
}

function BookingRow({ booking, role }: { booking: Booking; role: "poster" | "resolver" }) {
  const { showToast } = useToast();
  const completeBooking = useCompleteBooking();
  const cancelBooking = useCancelBooking();
  const [busy, setBusy] = useState(false);
  const [showMeeting, setShowMeeting] = useState(false);

  const canAct = booking.status === "scheduled";

  async function handleComplete() {
    setBusy(true);
    try {
      await completeBooking.mutateAsync(booking.id);
      showToast("Booking marked complete");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't complete that booking — try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    setBusy(true);
    try {
      await cancelBooking.mutateAsync(booking.id);
      showToast("Booking cancelled");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't cancel that booking — try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontWeight: 800, fontSize: 14 }}>{formatSlot(booking.slotAt)}</span>
        <span className={shared.muted}>{BOOKING_STATUS_LABEL[booking.status]}</span>
      </div>
      <p className={shared.muted} style={{ marginBottom: 10 }}>
        {booking.durationMins} min · {formatAmount(booking.amountCents)} · as {role}
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {booking.status === "scheduled" && (
          <Link href={`/bookings/${booking.id}/payment`}>
            <Button type="button" variant="secondary" style={{ width: "auto" }}>
              View payment
            </Button>
          </Link>
        )}
        {booking.status === "scheduled" &&
          (booking.joinUrl ? (
            <>
              <Button type="button" style={{ width: "auto" }} onClick={() => setShowMeeting(true)}>
                Join meeting
              </Button>
              {showMeeting && (
                <MeetingModal joinUrl={booking.joinUrl} onClose={() => setShowMeeting(false)} />
              )}
            </>
          ) : (
            <Button type="button" style={{ width: "auto" }} disabled title="Meeting link isn't ready yet">
              Join meeting (pending)
            </Button>
          ))}
        {canAct && (
          <>
            <Button type="button" style={{ width: "auto" }} disabled={busy} onClick={handleComplete}>
              Complete
            </Button>
            <Button type="button" variant="secondary" style={{ width: "auto" }} disabled={busy} onClick={handleCancel}>
              Cancel
            </Button>
          </>
        )}
      </div>

      {booking.status === "completed" && role === "poster" && <RatingPrompt bookingId={booking.id} />}
    </Card>
  );
}

export default function RequestsPage() {
  const [tab, setTab] = useState<Tab>("forMyDoubts");
  const me = useMe();
  const myDoubts = useMyDoubts(me.data?.id);
  const sentRequests = useResolutionRequests({ resolverUserId: me.data?.id });
  const posterBookings = useMyBookings("poster");
  const resolverBookings = useMyBookings("resolver");

  return (
    <PageTransition>
      <section style={{ padding: "32px 0" }}>
        <h1 className={shared.heading}>Requests</h1>

        <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid var(--line)" }} role="tablist">
          {(
            [
              { key: "forMyDoubts", label: "For my doubts" },
              { key: "sentByMe", label: "Sent by me" },
              { key: "bookings", label: "Bookings" },
            ] as { key: Tab; label: string }[]
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "8px 14px",
                fontSize: 14,
                fontWeight: 700,
                color: tab === t.key ? "var(--ink)" : "var(--muted)",
                borderBottom: tab === t.key ? "2px solid var(--accent)" : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "forMyDoubts" && (
          <>
            {myDoubts.isLoading && <Skeleton height={80} style={{ marginBottom: 12 }} />}
            {myDoubts.isError && (
              <Card>
                <h3>Couldn&apos;t load your doubts</h3>
                <p className={shared.muted}>Something went wrong reaching the server.</p>
                <Button type="button" onClick={() => myDoubts.refetch()}>
                  Try again
                </Button>
              </Card>
            )}
            {myDoubts.isSuccess && myDoubts.data.length === 0 && (
              <Card>
                <h3>No doubts posted yet</h3>
                <p className={shared.muted}>Post a doubt to start receiving offers to help.</p>
              </Card>
            )}
            {myDoubts.isSuccess &&
              myDoubts.data.length > 0 &&
              myDoubts.data.map((doubt) => <IncomingRequestsForDoubt key={doubt.id} doubt={doubt} />)}
          </>
        )}

        {tab === "sentByMe" && (
          <>
            {sentRequests.isLoading && <Skeleton height={80} style={{ marginBottom: 12 }} />}
            {sentRequests.isError && (
              <Card>
                <h3>Couldn&apos;t load your sent offers</h3>
                <p className={shared.muted}>Something went wrong reaching the server.</p>
                <Button type="button" onClick={() => sentRequests.refetch()}>
                  Try again
                </Button>
              </Card>
            )}
            {sentRequests.isSuccess && sentRequests.data.length === 0 && (
              <Card>
                <h3>You haven&apos;t offered to help with anything yet</h3>
                <p className={shared.muted}>Offers you send from the feed show up here.</p>
              </Card>
            )}
            {sentRequests.isSuccess &&
              sentRequests.data.map((request) => <SentRequestRow key={request.id} request={request} />)}
          </>
        )}

        {tab === "bookings" && (
          <>
            {(posterBookings.isLoading || resolverBookings.isLoading) && (
              <Skeleton height={80} style={{ marginBottom: 12 }} />
            )}
            {(posterBookings.isError || resolverBookings.isError) && (
              <Card>
                <h3>Couldn&apos;t load your bookings</h3>
                <p className={shared.muted}>Something went wrong reaching the server.</p>
                <Button
                  type="button"
                  onClick={() => {
                    posterBookings.refetch();
                    resolverBookings.refetch();
                  }}
                >
                  Try again
                </Button>
              </Card>
            )}
            {posterBookings.isSuccess &&
              resolverBookings.isSuccess &&
              posterBookings.data.length === 0 &&
              resolverBookings.data.length === 0 && (
                <Card>
                  <h3>No bookings yet</h3>
                  <p className={shared.muted}>Accepted offers turn into bookings here.</p>
                </Card>
              )}
            {posterBookings.data?.map((booking) => <BookingRow key={booking.id} booking={booking} role="poster" />)}
            {resolverBookings.data?.map((booking) => <BookingRow key={booking.id} booking={booking} role="resolver" />)}
          </>
        )}
      </section>
    </PageTransition>
  );
}
