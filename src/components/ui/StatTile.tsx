import { ReactNode } from "react";
import styles from "./StatTile.module.css";

export function StatTile({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={[styles.tile, accent && styles.accent].filter(Boolean).join(" ")}>
      <span className={styles.label}>{label}</span>
      <span className={[styles.value, "num"].join(" ")}>{value}</span>
      {sub ? <span className={styles.sub}>{sub}</span> : null}
    </div>
  );
}
