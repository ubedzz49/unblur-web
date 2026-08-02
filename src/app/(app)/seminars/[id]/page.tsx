"use client";

import { useParams } from "next/navigation";
import { useMe } from "@/lib/queries/users";
import { useRegisterForSeminar, useSeminar, useSeminarJoinUrl } from "@/lib/queries/seminars";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageTransition } from "@/components/ui/PageTransition";
import { useToast } from "@/components/ui/Toast";
import { confirmPayment } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import shared from "../../../shared.module.css";

export default function SeminarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const toast = useToast();
  const me = useMe();
  const seminar = useSeminar(id);
  const register = useRegisterForSeminar(id);
  const joinUrl = useSeminarJoinUrl(id);

  if (seminar.isLoading) return <p className={shared.muted} style={{ padding: "32px 0" }}>Loading…</p>;
  if (seminar.isError || !seminar.data) return <p className={shared.error} style={{ padding: "32px 0" }}>Couldn&apos;t load this seminar.</p>;

  const isHost = me.data?.id === seminar.data.hostUserId;

  async function handleRegister() {
    try {
      const registration = await register.mutateAsync();
      if (registration.paymentId && token) {
        await confirmPayment(token, registration.paymentId);
        toast.showToast("Registered and paid (sandbox)", "success");
      } else {
        toast.showToast("Registered", "success");
      }
    } catch (err) {
      toast.showToast(err instanceof Error ? err.message : "Couldn't register", "error");
    }
  }

  async function handleJoin() {
    try {
      const result = await joinUrl.mutateAsync();
      window.open(result.joinUrl, "_blank");
    } catch (err) {
      toast.showToast(err instanceof Error ? err.message : "Couldn't get the join link", "error");
    }
  }

  return (
    <PageTransition>
      <section style={{ padding: "32px 0" }}>
        <h1 className={shared.heading}>{seminar.data.title}</h1>
        <Card>
          {seminar.data.description && <p style={{ marginBottom: 16 }}>{seminar.data.description}</p>}
          <p className={shared.muted}>{new Date(seminar.data.scheduledAt).toLocaleString()}</p>
          <p className={shared.muted}>{seminar.data.durationMins} minutes</p>
          <p className={shared.muted}>
            {seminar.data.entryFeeCents === 0 ? "Free" : `₹${(seminar.data.entryFeeCents / 100).toFixed(0)} entry fee`}
          </p>
          <p className={shared.muted} style={{ marginBottom: 16 }}>Status: {seminar.data.status}</p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {!isHost && seminar.data.status === "scheduled" && (
              <Button onClick={handleRegister} status={register.isPending ? "loading" : "idle"} loadingLabel="Registering…">
                Register{seminar.data.entryFeeCents > 0 ? " and pay (sandbox)" : ""}
              </Button>
            )}
            {seminar.data.status !== "cancelled" && (
              <Button variant="secondary" onClick={handleJoin} status={joinUrl.isPending ? "loading" : "idle"} loadingLabel="Getting link…">
                {seminar.data.joinUrl ? "Join meeting" : "Get join link"}
              </Button>
            )}
          </div>
        </Card>
      </section>
    </PageTransition>
  );
}
