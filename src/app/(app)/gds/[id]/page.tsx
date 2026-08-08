"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { Mic, Timer, Users, Vote } from "lucide-react";
import { useMe } from "@/lib/queries/users";
import { useGd, useGdJoinUrl, useGdResults, useJoinGd, useVoteInGd } from "@/lib/queries/gds";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, Pill, LiveDot } from "@/components/scoreboard/kit";
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

function SpeakerTile({
  label,
  status,
  spokenSeconds,
  limitSeconds,
  speaking,
  muted,
}: {
  label: string;
  status: string;
  spokenSeconds: number;
  limitSeconds: number;
  speaking: boolean;
  muted: boolean;
}) {
  const overLimit = spokenSeconds >= limitSeconds;
  const pct = limitSeconds > 0 ? Math.min(100, (spokenSeconds / limitSeconds) * 100) : 0;
  return (
    <div
      className="relative rounded-[14px] border p-4"
      style={{
        borderColor: speaking ? "var(--violet)" : "var(--line)",
        background: "var(--surface)",
        opacity: muted ? 0.5 : 1,
      }}
    >
      <div className="mb-3 flex items-center gap-2.5">
        <span className="h-8 w-8 shrink-0 rounded-full" style={{ background: "var(--violet-dim)" }} />
        <div>
          <div className="text-[13px] font-semibold">{label}</div>
          <div className="text-[11px]" style={{ color: "var(--dim)" }}>{status}</div>
        </div>
      </div>
      <div className="mb-2 h-1.5 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: overLimit ? "var(--red)" : pct > 85 ? "var(--coral)" : "var(--violet)" }}
        />
      </div>
      <div className="text-right text-[11px]" style={{ color: "var(--dim)" }}>
        {spokenSeconds}s of {limitSeconds}s used
      </div>
    </div>
  );
}

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
          <div className="mt-5 rounded-[14px] border p-5" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
            <div className="mb-4 flex items-center gap-2">
              <p className="text-[13px] font-semibold uppercase tracking-wide" style={{ color: "var(--dim)" }}>Speaking</p>
              {speaking.speakers.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: "rgba(255,107,107,0.12)", color: "var(--red)" }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--red)" }} /> Live
                </span>
              )}
            </div>
            {!GD_SERVICE_WS_URL && (
              <p className="text-sm" style={{ color: "var(--dim)" }}>Real-time speaking controls aren&apos;t configured for this environment.</p>
            )}
            {isMuted && (
              <div className="mb-3.5 inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: "rgba(255,138,101,0.15)", color: "var(--coral)" }}>
                Muted for exceeding your speaking time
              </div>
            )}
            {speaking.speakers.length === 0 && <p className="text-sm" style={{ color: "var(--dim)" }}>No one is speaking right now.</p>}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              {speaking.speakers.map((s) => {
                const isSelf = s.userId === me.data?.id;
                const overLimit = s.spokenSeconds >= s.limitSeconds;
                return (
                  <SpeakerTile
                    key={s.userId}
                    label={isSelf ? "You" : s.userId}
                    status={overLimit ? "Muted, over cap" : "Speaking"}
                    spokenSeconds={s.spokenSeconds}
                    limitSeconds={s.limitSeconds}
                    speaking={!overLimit}
                    muted={overLimit && isMuted && isSelf}
                  />
                );
              })}
            </div>
            {socket && !isMuted && (
              <div className="mt-5 flex justify-center gap-3.5">
                <button
                  type="button"
                  onClick={() => socket.emit("speak_start", { gdId: id })}
                  className="flex h-12.5 w-12.5 items-center justify-center rounded-full border text-lg"
                  style={{ borderColor: "var(--line)", background: "var(--surface-2)" }}
                  aria-label="Start speaking"
                >
                  🎤
                </button>
                <button
                  type="button"
                  onClick={() => socket.emit("speak_stop", { gdId: id, elapsedSeconds: 0 })}
                  className="flex h-12.5 w-12.5 items-center justify-center rounded-full text-lg"
                  style={{ background: "var(--violet)", color: "var(--ink-strong)" }}
                  aria-label="Stop speaking / raise hand"
                >
                  ✋
                </button>
              </div>
            )}
            {isOrganizer && (
              <p className="mt-5 text-center text-xs" style={{ color: "var(--dim)" }}>
                You are the organizer. You can remove a disruptive participant from room settings, entry fees are not
                refunded on removal.
              </p>
            )}
          </div>
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
