"use client";

import Link from "next/link";
import { ArrowRight, Clock, Layers, PlusCircle, Presentation, Sparkles, Star, Users } from "lucide-react";
import { useMe, useMyStats } from "@/lib/queries/users";
import { useMyExpertise } from "@/lib/queries/expertise";
import { useFeed } from "@/lib/queries/doubts";
import { useGds } from "@/lib/queries/gds";
import { useMyBookings } from "@/lib/queries/resolution";
import { useNotifications } from "@/lib/queries/notifications";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card, LiveDot, SectionLabel, StatTile } from "@/components/scoreboard/kit";
import { useTranslation } from "@/lib/i18n/context";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import { relativeTime } from "@/lib/relative-time";
import type { Booking } from "@/lib/api";

const ACTIONS: { href: string; labelKey: TranslationKey; descKey: TranslationKey; icon: typeof PlusCircle; primary?: boolean }[] = [
  { href: "/doubts/new", labelKey: "home.postDoubt", descKey: "home.postDoubtDesc", icon: PlusCircle, primary: true },
  { href: "/feed", labelKey: "home.resolveDoubts", descKey: "home.resolveDoubtsDesc", icon: Layers },
  { href: "/gds", labelKey: "home.joinGd", descKey: "home.joinGdDesc", icon: Users },
  { href: "/seminars", labelKey: "home.seminars", descKey: "home.seminarsDesc", icon: Presentation },
];

function isUpcoming(booking: Booking): boolean {
  return booking.status === "scheduled";
}

export default function HomePage() {
  const me = useMe();
  const myStats = useMyStats();
  const myExpertise = useMyExpertise();
  const { t } = useTranslation();
  const expertiseLevelIds = (myExpertise.data ?? []).map((e) => e.expertiseLevelId);
  const feed = useFeed(expertiseLevelIds);
  const gds = useGds(false);
  const notifications = useNotifications({ limit: 5 });
  const postedBookings = useMyBookings("poster", "scheduled");
  const resolvingBookings = useMyBookings("resolver", "scheduled");

  const firstName = me.data?.name?.trim().split(" ")[0];
  const liveGd = gds.data?.find((g) => g.status === "live");
  const exactMatches = (feed.data ?? []).filter((d) => d.matchType === "exact").slice(0, 3);

  const upcomingBookings = [...(postedBookings.data ?? []), ...(resolvingBookings.data ?? [])]
    .filter(isUpcoming)
    .sort((a, b) => new Date(a.slotAt).getTime() - new Date(b.slotAt).getTime())
    .slice(0, 4);
  const recentNotifications = (notifications.data ?? []).slice(0, 5);

  return (
    <PageTransition>
      <div className="space-y-8 py-8">
        <section>
          {me.isLoading ? (
            <Skeleton width="50%" height={36} style={{ margin: "0 0 8px" }} />
          ) : (
            <>
              <p className="text-sm font-semibold text-muted-foreground">{t("home.greeting")}</p>
              <h1 className="text-fluid-title mt-0.5">{firstName ?? "there"}.</h1>
            </>
          )}

          {myStats.isSuccess && (
            <Link href="/profile" className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatTile
                label={t("profile.minutesResolved")}
                value={myStats.data.minutesResolved}
                icon={Clock}
                accent
              />
              <StatTile
                label={t("profile.avgRating")}
                value={myStats.data.ratingCount > 0 ? myStats.data.avgRating.toFixed(1) : "—"}
                icon={Star}
              />
              <StatTile
                label={t("profile.communicationScore")}
                value={myStats.data.gdPoints.toFixed(1)}
                icon={Sparkles}
              />
            </Link>
          )}
        </section>

        <section>
          <SectionLabel>{t("home.getStarted")}</SectionLabel>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                    <div className="mt-3 text-sm font-semibold">{t(a.labelKey)}</div>
                    <div className="mt-0.5 text-xs leading-snug text-muted-foreground">{t(a.descKey)}</div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
          <Card className="p-4">
            <SectionLabel>{t("home.recentActivity")}</SectionLabel>
            <p className="-mt-2 mb-3 text-xs text-muted-foreground">{t("home.recentActivityDesc")}</p>
            {recentNotifications.length > 0 ? (
              <div>
                {recentNotifications.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 border-t border-border py-3 first:border-t-0 first:pt-0">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.readAt ? "bg-muted-foreground/30" : "bg-primary"}`}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{n.title}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{relativeTime(n.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-2 text-sm text-muted-foreground">{t("home.noActivity")}</p>
            )}
          </Card>

          <Card className="p-4">
            <SectionLabel>{t("home.upcoming")}</SectionLabel>
            <p className="-mt-2 mb-3 text-xs text-muted-foreground">{t("home.upcomingDesc")}</p>
            {upcomingBookings.length > 0 ? (
              <div>
                {upcomingBookings.map((b) => (
                  <Link
                    key={b.id}
                    href={`/bookings/${b.id}/payment`}
                    className="flex items-center justify-between gap-3 border-t border-border py-3 first:border-t-0 first:pt-0"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{b.durationMins} min session</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(b.slotAt).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="py-2 text-sm text-muted-foreground">{t("home.noUpcoming")}</p>
            )}
          </Card>
        </section>

        {liveGd && (
          <section>
            <SectionLabel>{t("home.happeningNow")}</SectionLabel>
            <Link href={`/gds/${liveGd.id}`}>
              <Card interactive className="overflow-hidden">
                <div className="flex items-center gap-2 border-b border-border bg-destructive/10 px-4 py-2 text-destructive">
                  <LiveDot />
                  <span className="text-xs font-semibold uppercase tracking-wide">{t("home.liveGd")}</span>
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
                  {t("home.seeAll")} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            >
              {t("home.matchedToYou")}
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
