"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { useMe } from "@/lib/queries/users";
import { useGd, useGdJoinUrl, useGdResults, useJoinGd, useVoteInGd } from "@/lib/queries/gds";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageTransition } from "@/components/ui/PageTransition";
import { useToast } from "@/components/ui/Toast";
import { confirmPayment } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import shared from "../../../shared.module.css";

interface SpeakingState {
  speakers: { userId: string; spokenSeconds: number; limitSeconds: number }[];
}

// Talks to gd-service directly (not through the gateway) -- Socket.IO doesn't traverse
// gateway-core's HTTP proxy the way REST calls do, same reasoning documented on the service
// side. GD_SERVICE_WS_URL falls back to the gateway host on the service's own port.
const GD_SERVICE_WS_URL = process.env.NEXT_PUBLIC_GD_SERVICE_WS_URL ?? "";

function useGdLiveRoom(gdId: string, token: string | null) {
  const [speaking, setSpeaking] = useState<SpeakingState>({ speakers: [] });
  const [isMuted, setIsMuted] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!token || !GD_SERVICE_WS_URL) return;
    const s = io(GD_SERVICE_WS_URL, { auth: { token } });

    s.on("connect", () => {
      s.emit("join_gd", { gdId });
      // event-handler callback, not the effect body itself -- fine to setState here
      setSocket(s);
    });
    s.on("speaking_state", (state: SpeakingState) => setSpeaking(state));
    s.on("muted", (payload: { userId: string; mutedUntilTs: number }) => {
      setIsMuted(true);
      const remainingMs = payload.mutedUntilTs - Date.now();
      setTimeout(() => setIsMuted(false), Math.max(0, remainingMs));
    });

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [gdId, token]);

  return { speaking, isMuted, socket };
}

export default function GdDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const toast = useToast();
  const me = useMe();
  const gd = useGd(id);
  const join = useJoinGd(id);
  const joinUrl = useGdJoinUrl(id);
  const vote = useVoteInGd(id);
  const results = useGdResults(id, gd.data?.status === "completed");
  const { speaking, isMuted, socket } = useGdLiveRoom(id, token);

  const [firstUserId, setFirstUserId] = useState("");
  const [secondUserId, setSecondUserId] = useState("");
  const [thirdUserId, setThirdUserId] = useState("");

  if (gd.isLoading) return <p className={shared.muted} style={{ padding: "32px 0" }}>Loading…</p>;
  if (gd.isError || !gd.data) return <p className={shared.error} style={{ padding: "32px 0" }}>Couldn&apos;t load this GD.</p>;

  const isOrganizer = me.data?.id === gd.data.organizerUserId;

  async function handleJoin() {
    try {
      const participant = await join.mutateAsync();
      if (participant.paymentId && token) {
        await confirmPayment(token, participant.paymentId);
        toast.showToast("Joined and paid (sandbox)", "success");
      } else {
        toast.showToast("Joined", "success");
      }
    } catch (err) {
      toast.showToast(err instanceof Error ? err.message : "Couldn't join", "error");
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

  async function handleVote(e: React.FormEvent) {
    e.preventDefault();
    if (!firstUserId || !secondUserId || !thirdUserId) {
      toast.showToast("Pick all three speakers", "error");
      return;
    }
    try {
      await vote.mutateAsync({ firstUserId, secondUserId, thirdUserId });
      toast.showToast("Vote submitted", "success");
    } catch (err) {
      toast.showToast(err instanceof Error ? err.message : "Couldn't submit vote", "error");
    }
  }

  return (
    <PageTransition>
      <section style={{ padding: "32px 0" }}>
        <h1 className={shared.heading}>{gd.data.topic}</h1>
        <Card>
          <p className={shared.muted}>{new Date(gd.data.scheduledAt).toLocaleString()}</p>
          <p className={shared.muted}>{gd.data.durationMins} minutes</p>
          <p className={shared.muted}>
            {gd.data.entryFeeCents === 0 ? "Free" : `₹${(gd.data.entryFeeCents / 100).toFixed(0)} entry fee`}
          </p>
          <p className={shared.muted} style={{ marginBottom: 16 }}>Status: {gd.data.status}</p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {!isOrganizer && gd.data.status === "scheduled" && (
              <Button onClick={handleJoin} status={join.isPending ? "loading" : "idle"} loadingLabel="Joining…">
                Join{gd.data.entryFeeCents > 0 ? " and pay (sandbox)" : ""}
              </Button>
            )}
            {gd.data.status !== "cancelled" && (
              <Button
                variant="secondary"
                onClick={handleGetJoinUrl}
                status={joinUrl.isPending ? "loading" : "idle"}
                loadingLabel="Getting link…"
              >
                {gd.data.joinUrl ? "Join meeting" : "Get join link"}
              </Button>
            )}
          </div>
        </Card>

        {gd.data.status !== "completed" && gd.data.status !== "cancelled" && (
          <Card style={{ marginTop: 16 }}>
            <p style={{ fontWeight: 700, marginBottom: 8 }}>Speaking</p>
            {!GD_SERVICE_WS_URL && (
              <p className={shared.muted}>Real-time speaking controls aren&apos;t configured for this environment.</p>
            )}
            {isMuted && <p className={shared.error}>You&apos;re muted for exceeding your speaking time.</p>}
            {speaking.speakers.length === 0 && <p className={shared.muted}>No one is speaking right now.</p>}
            {speaking.speakers.map((s) => (
              <p key={s.userId} className={shared.muted}>
                {s.userId === me.data?.id ? "You" : s.userId}: {s.spokenSeconds}s / {s.limitSeconds}s
              </p>
            ))}
            {socket && !isMuted && (
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Button variant="secondary" onClick={() => socket.emit("speak_start", { gdId: id })}>
                  Start speaking
                </Button>
                <Button variant="secondary" onClick={() => socket.emit("speak_stop", { gdId: id, elapsedSeconds: 0 })}>
                  Stop speaking
                </Button>
              </div>
            )}
          </Card>
        )}

        {gd.data.status === "completed" && (
          <Card style={{ marginTop: 16 }}>
            <p style={{ fontWeight: 700, marginBottom: 8 }}>Vote for the best 3 speakers</p>
            <form onSubmit={handleVote} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Input label="1st place (user id)" value={firstUserId} onChange={(e) => setFirstUserId(e.target.value)} />
              <Input label="2nd place (user id)" value={secondUserId} onChange={(e) => setSecondUserId(e.target.value)} />
              <Input label="3rd place (user id)" value={thirdUserId} onChange={(e) => setThirdUserId(e.target.value)} />
              <Button type="submit" status={vote.isPending ? "loading" : "idle"} loadingLabel="Submitting…">
                Submit vote
              </Button>
            </form>

            {results.data && results.data.results.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontWeight: 700, marginBottom: 8 }}>Current results</p>
                {results.data.results.map((r) => (
                  <p key={r.userId} className={shared.muted}>
                    {r.userId === me.data?.id ? "You" : r.userId}: {r.points.toFixed(1)} pts
                  </p>
                ))}
              </div>
            )}
          </Card>
        )}
      </section>
    </PageTransition>
  );
}
