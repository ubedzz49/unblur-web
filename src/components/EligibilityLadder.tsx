import { UserStats } from "@/lib/api";
import { ProgressMeter } from "@/components/ui/ProgressMeter";
import styles from "./EligibilityLadder.module.css";

// thresholds from the eligibility ladder spec: 300min+3.5 rating hosts seminars,
// 100min organizes a GD, 50min as a listener can attend one
const RUNGS = [
  {
    key: "canOrganizeGD" as const,
    title: "Organize a GD",
    metric: (s: UserStats) => s.minutesResolved,
    target: 100,
    unit: "min resolved",
  },
  {
    key: "canAttendGD" as const,
    title: "Attend a GD",
    metric: (s: UserStats) => s.minutesListener,
    target: 50,
    unit: "min listened",
  },
  {
    key: "canHostSeminar" as const,
    title: "Host a seminar",
    metric: (s: UserStats) => s.minutesResolved,
    target: 300,
    unit: "min resolved",
    secondary: { label: "rating", metric: (s: UserStats) => s.avgRating, target: 3.5 },
  },
];

export function EligibilityLadder({ stats }: { stats: UserStats }) {
  return (
    <ol className={styles.list}>
      {RUNGS.map((rung) => {
        const unlocked = stats.eligibility[rung.key];
        const current = rung.metric(stats);
        const remaining = Math.max(0, rung.target - current);

        return (
          <li key={rung.key} className={[styles.rung, unlocked && styles.unlocked].filter(Boolean).join(" ")}>
            <div className={styles.node} aria-hidden="true">
              {unlocked ? "✓" : "🔒"}
            </div>
            <div className={styles.body}>
              <div className={styles.headRow}>
                <h3 className={styles.title}>{rung.title}</h3>
                <span className={unlocked ? styles.unlockedTag : styles.lockedTag}>
                  {unlocked ? "Unlocked" : "Locked"}
                </span>
              </div>
              {!unlocked && (
                <>
                  <div className={styles.progressRow}>
                    <span className="num">
                      {current}/{rung.target} {rung.unit}
                    </span>
                    <span className="num">{remaining} to go</span>
                  </div>
                  <ProgressMeter value={current} max={rung.target} />
                  {rung.secondary && (
                    <p className={styles.secondary}>
                      + {rung.secondary.metric(stats).toFixed(1)}/{rung.secondary.target} avg {rung.secondary.label}
                    </p>
                  )}
                </>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
