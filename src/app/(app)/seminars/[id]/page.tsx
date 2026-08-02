"use client";

import { useParams } from "next/navigation";
import { useMe } from "@/lib/queries/users";
import { useRegisterForSeminar, useSeminar, useSeminarJoinUrl } from "@/lib/queries/seminars";
import { Button } from "@/components/ui/Button";
import { PageTransition } from "@/components/ui/PageTransition";
import { useToast } from "@/components/ui/Toast";
import { Card, Pill, LiveDot, StatTile } from "@/components/scoreboard/kit";
import { RegisterPanel } from "@/components/scoreboard/register-panel";
import { confirmPayment } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

// mirrors the tone mapping on the seminars list / GD detail pages so status reads
// consistently everywhere it shows up
function toneForStatus(status: string): "live" | "danger" | "outline" {
  if (status === "live") return "live";
  if (status === "cancelled") return "danger";
  return "outline";
}

function formatFee(cents: number): string {
  return cents === 0 ? "Free" : `₹${(cents / 100).toFixed(0)}`;
}

export default function SeminarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const toast = useToast();
  const me = useMe();
  const seminar = useSeminar(id);
  const register = useRegisterForSeminar(id);
  const joinUrl = useSeminarJoinUrl(id);

  if (seminar.isLoading) return <p className="py-8 text-sm text-muted-foreground">Loading…</p>;
  if (seminar.isError || !seminar.data) return <p className="py-8 text-sm text-destructive">Couldn&apos;t load this seminar.</p>;

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

  async function handleGetJoinUrl() {
    try {
      const result = await joinUrl.mutateAsync();
      window.open(result.joinUrl, "_blank");
    } catch (err) {
      toast.showToast(err instanceof Error ? err.message : "Couldn't get the join link", "error");
    }
  }

  return (
    <PageTransition>
      <div className="space-y-5 py-8">
        <div>
          <Pill tone={toneForStatus(seminar.data.status)}>
            {seminar.data.status === "live" && <LiveDot />}
            {seminar.data.status}
          </Pill>
          <h1 className="mt-2 text-pretty text-2xl font-black leading-tight">{seminar.data.title}</h1>
        </div>

        {seminar.data.description && (
          <Card className="p-4">
            <p className="text-sm leading-relaxed text-muted-foreground">{seminar.data.description}</p>
          </Card>
        )}

        <p className="num text-sm text-muted-foreground">{new Date(seminar.data.scheduledAt).toLocaleString()}</p>

        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Entry fee" value={formatFee(seminar.data.entryFeeCents)} accent={seminar.data.entryFeeCents > 0} />
          <StatTile label="Duration" value={seminar.data.durationMins} sub="minutes" />
        </div>

        {isHost && seminar.data.status !== "cancelled" && (
          <Card className="p-4">
            <Button
              variant="secondary"
              onClick={handleGetJoinUrl}
              status={joinUrl.isPending ? "loading" : "idle"}
              loadingLabel="Getting link…"
            >
              {seminar.data.joinUrl ? "Join meeting" : "Get join link"}
            </Button>
          </Card>
        )}

        {!isHost && seminar.data.status === "scheduled" && (
          <RegisterPanel
            fee={seminar.data.entryFeeCents / 100}
            cta={seminar.data.entryFeeCents > 0 ? "Register and pay (sandbox)" : "Register"}
            payeeNote="90% goes to the host, 10% to the platform. Sandbox payment — no real charge."
            status={register.isSuccess ? "joined" : register.isPending ? "paying" : "idle"}
            onPay={handleRegister}
            joinUrl={seminar.data.joinUrl}
            onGetJoinUrl={handleGetJoinUrl}
          />
        )}

        {!isHost && seminar.data.status !== "scheduled" && seminar.data.status !== "cancelled" && (
          <Card className="p-4">
            <Button
              variant="secondary"
              onClick={handleGetJoinUrl}
              status={joinUrl.isPending ? "loading" : "idle"}
              loadingLabel="Getting link…"
            >
              {seminar.data.joinUrl ? "Join meeting" : "Get join link"}
            </Button>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
