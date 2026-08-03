"use client";

import Link from "next/link";
import { Clock, Headphones, Settings, Star, Sparkles } from "lucide-react";
import { useMe, useMyStats } from "@/lib/queries/users";
import { ProfileCardSkeleton } from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/PageTransition";
import { SectionLabel, StatTile } from "@/components/scoreboard/kit";
import { ScoreHero } from "@/components/scoreboard/score-hero";
import { EligibilityLadder } from "@/components/scoreboard/eligibility-ladder";
import { UserStats } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/context";
import shared from "../../shared.module.css";

// derived from the real gdPoints stat -- not a fabricated field, just a label tier
// over a number the API already returns
function scoreRank(gdPoints: number, t: (key: "profile.new" | "profile.rising" | "profile.advanced" | "profile.elite") => string): string {
  if (gdPoints >= 100) return t("profile.elite");
  if (gdPoints >= 50) return t("profile.advanced");
  if (gdPoints >= 20) return t("profile.rising");
  return t("profile.new");
}

export default function ProfilePage() {
  const me = useMe();
  const myStats = useMyStats();
  const { t } = useTranslation();

  if (me.isLoading) {
    return (
      <section style={{ padding: "32px 0" }}>
        <ProfileCardSkeleton />
      </section>
    );
  }

  if (me.isError || !me.data) {
    return (
      <p className={shared.error} style={{ padding: "32px 0" }}>
        Couldn&apos;t load your profile. Try refreshing the page.
      </p>
    );
  }

  const initials = (me.data.name ?? me.data.email ?? me.data.phone ?? "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <PageTransition>
      <div className="space-y-8 py-8">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1" />
          <Link
            href="/settings"
            aria-label={t("profile.openSettings")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
          >
            <Settings className="h-4.5 w-4.5" />
          </Link>
        </div>

        {myStats.isSuccess && (
          <ScoreHero
            name={me.data.name ?? "Unnamed"}
            bio={me.data.bio || "No bio yet."}
            initials={initials}
            score={myStats.data.gdPoints}
            rank={scoreRank(myStats.data.gdPoints, t)}
          />
        )}

        <section>
          <SectionLabel>{t("profile.careerStats")}</SectionLabel>
          {myStats.isLoading && <div className="grid grid-cols-2 gap-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-elevated" />)}</div>}
          {myStats.isError && <p className={shared.muted}>Couldn&apos;t load your stats.</p>}
          {myStats.isSuccess && <CareerStats stats={myStats.data} t={t} />}
        </section>

        <section>
          <SectionLabel>{t("profile.yourLadder")}</SectionLabel>
          <p className="-mt-1 mb-4 text-sm leading-relaxed text-muted-foreground">{t("profile.ladderIntro")}</p>
          {myStats.isSuccess && <EligibilityLadder stats={myStats.data} />}
        </section>
      </div>
    </PageTransition>
  );
}

function CareerStats({ stats, t }: { stats: UserStats; t: ReturnType<typeof useTranslation>["t"] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatTile label={t("profile.minutesResolved")} value={stats.minutesResolved} sub={t("profile.minutesResolvedSub")} icon={Clock} accent />
      <StatTile
        label={t("profile.avgRating")}
        value={stats.ratingCount > 0 ? stats.avgRating.toFixed(1) : "—"}
        sub={`${stats.ratingCount} ${t("profile.ratings")}`}
        icon={Star}
      />
      <StatTile label={t("profile.listenerMinutes")} value={stats.minutesListener} sub={t("profile.listenerMinutesSub")} icon={Headphones} />
      <StatTile label={t("profile.communicationScore")} value={stats.gdPoints.toFixed(1)} sub={scoreRank(stats.gdPoints, t)} icon={Sparkles} />
    </div>
  );
}
