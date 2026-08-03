import { Check, Lock, Sparkles } from "lucide-react";
import { ProgressMeter } from "@/components/scoreboard/kit";
import { cn } from "@/lib/utils";
import { UserStats } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/context";

// thresholds from the eligibility ladder spec: 100min organizes a GD, 50min as a
// listener attends one, 300min+3.5 rating hosts seminars
const RUNGS = [
  {
    key: "canOrganizeGD" as const,
    titleKey: "profile.organizeGd" as const,
    blurbKey: "profile.organizeGdDesc" as const,
    metric: (s: UserStats) => s.minutesResolved,
    target: 100,
    unit: "min resolved",
  },
  {
    key: "canAttendGD" as const,
    titleKey: "profile.attendGd" as const,
    blurbKey: "profile.attendGdDesc" as const,
    metric: (s: UserStats) => s.minutesListener,
    target: 50,
    unit: "min listened",
  },
  {
    key: "canHostSeminar" as const,
    titleKey: "profile.hostSeminar" as const,
    blurbKey: "profile.hostSeminarDesc" as const,
    metric: (s: UserStats) => s.minutesResolved,
    target: 300,
    unit: "min resolved",
    secondary: { label: "rating", metric: (s: UserStats) => s.avgRating, target: 3.5 },
  },
];

export function EligibilityLadder({ stats }: { stats: UserStats }) {
  const { t } = useTranslation();

  return (
    <ol className="relative space-y-3">
      {RUNGS.map((rung, i) => {
        const unlocked = stats.eligibility[rung.key];
        const current = rung.metric(stats);
        const remaining = Math.max(0, rung.target - current);
        const isLast = i === RUNGS.length - 1;

        return (
          <li key={rung.key} className="relative flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 font-semibold",
                  unlocked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground",
                )}
              >
                {unlocked ? <Check className="h-4.5 w-4.5" /> : <Lock className="h-4 w-4" />}
              </span>
              {!isLast && <span className={cn("w-0.5 flex-1", unlocked ? "bg-primary/40" : "bg-border")} />}
            </div>

            <div className={cn("mb-1 flex-1 rounded-2xl border p-4", unlocked ? "border-primary/25 bg-primary/5" : "border-border bg-card")}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold tracking-tight">{t(rung.titleKey)}</h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t(rung.blurbKey)}</p>
                </div>
                {unlocked ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-primary">
                    <Sparkles className="h-3 w-3" />
                    {t("profile.unlocked")}
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full border border-border px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("profile.locked")}
                  </span>
                )}
              </div>

              {!unlocked && (
                <div className="mt-3">
                  <div className="mb-1.5 flex items-baseline justify-between text-xs">
                    <span className="font-semibold text-muted-foreground">Progress</span>
                    <span className="num font-bold text-foreground">
                      {current}
                      <span className="text-muted-foreground">/{rung.target}</span> {rung.unit}
                    </span>
                  </div>
                  <ProgressMeter value={current} max={rung.target} />
                  <div className="mt-2 flex items-center justify-between">
                    {rung.secondary ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-[0.7rem] font-semibold",
                          rung.secondary.metric(stats) >= rung.secondary.target ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        {rung.secondary.metric(stats) >= rung.secondary.target ? <Check className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                        {rung.secondary.label} {rung.secondary.metric(stats).toFixed(1)}/{rung.secondary.target}
                      </span>
                    ) : (
                      <span />
                    )}
                    {remaining > 0 ? (
                      <span className="num rounded-full bg-elevated px-2 py-0.5 text-[0.7rem] font-semibold text-foreground">
                        {remaining} {t("profile.toGo")}
                      </span>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
