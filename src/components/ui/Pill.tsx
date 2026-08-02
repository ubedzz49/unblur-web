import { ReactNode } from "react";
import styles from "./Pill.module.css";

type Tone = "neutral" | "gold" | "danger" | "outline" | "live" | "success";

const TONE_CLASS: Record<Tone, string> = {
  neutral: styles.neutral,
  gold: styles.gold,
  danger: styles.danger,
  success: styles.gold,
  outline: styles.outline,
  live: styles.live,
};

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return <span className={[styles.pill, TONE_CLASS[tone], className].filter(Boolean).join(" ")}>{children}</span>;
}
