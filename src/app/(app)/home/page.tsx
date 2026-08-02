"use client";

import Link from "next/link";
import { ArrowRight, Layers, PlusCircle, Presentation, Trophy, Users } from "lucide-react";
import { useMe, useMyStats } from "@/lib/queries/users";
import { useMyExpertise } from "@/lib/queries/expertise";
import { useFeed } from "@/lib/queries/doubts";
import { useGds } from "@/lib/queries/gds";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/PageTransition";
import { Avatar, Card, LiveDot, Pill, SectionLabel } from "@/components/scoreboard/kit";

const ACTIONS = [
  { href: "/doubts/new", label: "Post a doubt", desc: "Get a real person on a call", icon: PlusCircle, primary: true },
  { href: "/feed", label: "Resolve doubts", desc: "Earn from your expertise", icon: Layers },
  { href: "/gds", label: "Join a GD", desc: "Build your score", icon: Users },
  { href: "/seminars", label: "Seminars", desc: "Learn from proven hosts", icon: Presentation },
];

export default function HomePage() {
  const me = useMe();
  const myStats = useMyStats();
  const myExpertise = useMyExpertise();
  const expertiseLevelIds = (myExpertise.data ?? []).map((e) => e.expertiseLevelId);
  const feed = useFeed(expertiseLevelIds);
  const gds = useGds(false);

  const firstName = me.data?.name?.trim().split(" ")[0];
  const initials = (me.data?.name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const liveGd = gds.data?.find((g) => g.status === "live");
  const exactMatches = (feed.data ?? []).filter((d) => d.matchType === "exact").slice(0, 3);

  return (
    <PageTransition>
      <div className="space-y-8 py-8">
        <section>
          {me.isLoading ? (
            <Skeleton width="50%" height={36} style={{ margin: "0 0 8px" }} />
          ) : (
            <>
              <p className="text-sm font-semibold text-muted-foreground">Welcome back,</p>
              <h1 className="text-fluid-title mt-0.5">{firstName ?? "there"}.</h1>
            </>
          )}

          {myStats.isSuccess && (
            <Card className="mt-4 flex items-center justify-between gap-4 p-4">
              <Link href="/profile" className="flex items-center gap-3">
                <Avatar initials={initials} size="md" ring />
                <div>
                  <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <Trophy className="h-3.5 w-3.5 text-primary" /> Your score
                  </div>
                  <div className="num text-2xl font-semibold leading-none text-primary">{myStats.data.gdPoints.toFixed(1)}</div>
                </div>
              </Link>
              <div className="text-right">
                <Pill tone="gold">{myStats.data.minutesResolved} min resolved</Pill>
              </div>
            </Card>
          )}
        </section>

        <section>
          <SectionLabel>Get started</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            {ACTIONS.map((a) => {
              const Icon = a.icon;
              return (
                <Link key={a.href} href={a.href}>
                  <Card interactive className={`h-full p-4 ${a.primary ? "border-primary/40 bg-primary/5" : ""}`}>
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        a.primary ? "bg-primary text-primary-foreground" : "bg-elevated text-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="mt-3 text-sm font-semibold">{a.label}</div>
                    <div className="mt-0.5 text-xs leading-snug text-muted-foreground">{a.desc}</div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {liveGd && (
          <section>
            <SectionLabel>Happening now</SectionLabel>
            <Link href={`/gds/${liveGd.id}`}>
              <Card interactive className="overflow-hidden">
                <div className="flex items-center gap-2 border-b border-border bg-destructive/10 px-4 py-2 text-destructive">
                  <LiveDot />
                  <span className="text-xs font-semibold uppercase tracking-wide">Live GD</span>
                </div>
                <div className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <h3 className="text-pretty text-sm font-bold leading-snug">{liveGd.topic}</h3>
                    <div className="mt-1 text-xs text-muted-foreground">{liveGd.durationMins} min</div>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <ArrowRight className="h-4.5 w-4.5" />
                  </span>
                </div>
              </Card>
            </Link>
          </section>
        )}

        {exactMatches.length > 0 && (
          <section>
            <SectionLabel
              action={
                <Link href="/feed" className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                  See all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            >
              Matched to your expertise
            </SectionLabel>
            <div className="space-y-3">
              {exactMatches.map((d) => (
                <Link key={d.id} href={`/doubts/${d.id}/resolve`}>
                  <Card interactive className="p-4">
                    <h3 className="text-sm font-bold leading-snug">{d.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{d.description}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </PageTransition>
  );
}
