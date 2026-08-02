"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { Mic, Timer, Users, Vote } from "lucide-react";
import { useMe } from "@/lib/queries/users";
import { useGd, useGdJoinUrl, useGdResults, useJoinGd, useVoteInGd } from "@/lib/queries/gds";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, Pill, LiveDot, ProgressMeter } from "@/components/scoreboard/kit";
import { PageTransition } from "@/components/ui/PageTransition";
import { useToast } from "@/components/ui/Toast";
import { RegisterPanel } from "@/components/scoreboard/register-panel";
import { confirmPayment } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import shared from "../../../shared.module.css";

const RULES = [
  { icon: Users, title: "Max 3 speakers", desc: "Only three people hold the mic at once." },
  { icon: Timer, title: "Equal speaking time", desc: "Everyone gets up to 1/10th of the duration to speak." },
  { icon: Mic, title: "Overtime = mute", desc: "Go past your limit and you're muted for a short penalty." },
  { icon: Vote, title: "Vote at the end", desc: "Rank your top 3 speakers. Points build your score." },
];

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
        <Card className="p-5">
          <div className="mb-3">
            <Pill tone={gd.data.status === "live" ? "live" : gd.data.status === "cancelled" ? "danger" : "outline"}>
              {gd.data.status === "live" && <LiveDot />}
              {gd.data.status.replace("_", " ")}
            </Pill>
          </div>
          <p className={shared.muted}>{new Date(gd.data.scheduledAt).toLocaleString()}</p>
          <p className={shared.muted}>{gd.data.durationMins} minutes</p>
          <p className={`${shared.muted} mb-4`}>
            {gd.data.entryFeeCents === 0 ? "Free" : `₹${(gd.data.entryFeeCents / 100).toFixed(0)} entry fee`}
          </p>

          {isOrganizer && gd.data.status !== "cancelled" && (
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                onClick={handleGetJoinUrl}
                status={joinUrl.isPending ? "loading" : "idle"}
                loadingLabel="Getting link…"
              >
                {gd.data.joinUrl ? "Join meeting" : "Get join link"}
              </Button>
            </div>
          )}
        </Card>

        <div className="my-4 grid grid-cols-2 gap-3">
          {RULES.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.title} className="rounded-2xl border border-border bg-card p-4">
                <Icon className="h-5 w-5 text-primary" />
                <div className="mt-2 text-sm font-semibold">{r.title}</div>
                <div className="mt-0.5 text-xs leading-snug text-muted-foreground">{r.desc}</div>
              </div>
            );
          })}
        </div>

        {!isOrganizer && gd.data.status === "scheduled" && (
          <RegisterPanel
            fee={gd.data.entryFeeCents / 100}
            cta={gd.data.entryFeeCents > 0 ? "Join and pay (sandbox)" : "Join"}
            payeeNote="Your entry fee goes directly to the organizer. Sandbox payment — no real charge."
            status={join.isSuccess ? "joined" : join.isPending ? "paying" : "idle"}
            onPay={handleJoin}
            joinUrl={gd.data.joinUrl}
            onGetJoinUrl={handleGetJoinUrl}
          />
        )}

        {gd.data.status !== "completed" && gd.data.status !== "cancelled" && (
          <Card className="mt-4 p-5">
            <div className="mb-3 flex items-center gap-2">
              <p className="font-semibold">Speaking</p>
              {speaking.speakers.length > 0 && <Pill tone="live"><LiveDot /> Live</Pill>}
            </div>
            {!GD_SERVICE_WS_URL && (
              <p className={shared.muted}>Real-time speaking controls aren&apos;t configured for this environment.</p>
            )}
            {isMuted && (
              <div className="mb-3">
                <Pill tone="danger">Muted for exceeding your speaking time</Pill>
              </div>
            )}
            {speaking.speakers.length === 0 && <p className={shared.muted}>No one is speaking right now.</p>}
            <div className="flex flex-col gap-3">
              {speaking.speakers.map((s) => {
                const isSelf = s.userId === me.data?.id;
                const overLimit = s.spokenSeconds >= s.limitSeconds;
                return (
                  <div key={s.userId} className={`rounded-xl p-2 ${overLimit ? "" : "animate-speaking"}`}>
                    <div className="mb-1.5 flex justify-between text-[13px]">
                      <span className="font-bold">{isSelf ? "You" : s.userId}</span>
                      <span className={`num ${overLimit ? "text-destructive" : "text-muted-foreground"}`}>
                        {s.spokenSeconds}s / {s.limitSeconds}s
                      </span>
                    </div>
                    <ProgressMeter value={s.spokenSeconds} max={s.limitSeconds} tone={overLimit ? "danger" : "gold"} />
                  </div>
                );
              })}
            </div>
            {socket && !isMuted && (
              <div className="mt-4 flex gap-2">
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
          <Card className="mt-4 p-5">
            <p className="mb-2 font-bold">Vote for the best 3 speakers</p>
            <form onSubmit={handleVote} className="flex flex-col gap-3">
              <Input label="1st place (user id)" value={firstUserId} onChange={(e) => setFirstUserId(e.target.value)} />
              <Input label="2nd place (user id)" value={secondUserId} onChange={(e) => setSecondUserId(e.target.value)} />
              <Input label="3rd place (user id)" value={thirdUserId} onChange={(e) => setThirdUserId(e.target.value)} />
              <Button type="submit" status={vote.isPending ? "loading" : "idle"} loadingLabel="Submitting…">
                Submit vote
              </Button>
            </form>

            {results.data && results.data.results.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 font-semibold">Current results</p>
                <div className="flex flex-col gap-2">
                  {results.data.results.map((r, i) => (
                    <div key={r.userId} className="flex items-center justify-between">
                      <span className="font-bold">
                        {i === 0 ? <Pill tone="gold">#1</Pill> : <span className={shared.muted}>#{i + 1}</span>}{" "}
                        {r.userId === me.data?.id ? "You" : r.userId}
                      </span>
                      <span className="num font-semibold">{r.points.toFixed(1)} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}
      </section>
    </PageTransition>
  );
}
