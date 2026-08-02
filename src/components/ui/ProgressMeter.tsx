import styles from "./ProgressMeter.module.css";

export function ProgressMeter({
  value,
  max,
  tone = "gold",
}: {
  value: number;
  max: number;
  tone?: "gold" | "danger" | "muted";
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className={styles.track} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={[styles.fill, styles[tone]].join(" ")} style={{ width: `${pct}%` }} />
    </div>
  );
}
