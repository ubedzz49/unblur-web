import { CSSProperties } from "react";
import styles from "./Skeleton.module.css";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string | number;
  style?: CSSProperties;
}

export function Skeleton({ width = "100%", height = 16, radius, style }: SkeletonProps) {
  return (
    <span
      className={styles.skeleton}
      style={{ display: "block", width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

export function DoubtCardSkeleton() {
  return (
    <div style={{ padding: 16 }}>
      <Skeleton width="70%" height={18} style={{ marginBottom: 12 }} />
      <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
      <Skeleton width="90%" height={14} style={{ marginBottom: 14 }} />
      <Skeleton width="30%" height={12} />
    </div>
  );
}

export function ProfileCardSkeleton() {
  return (
    <div style={{ maxWidth: 440 }}>
      <Skeleton width={88} height={88} radius="50%" style={{ marginBottom: 20 }} />
      <Skeleton width="60%" height={14} style={{ marginBottom: 10 }} />
      <Skeleton width="100%" height={44} style={{ marginBottom: 16 }} />
      <Skeleton width="60%" height={14} style={{ marginBottom: 10 }} />
      <Skeleton width="100%" height={44} style={{ marginBottom: 16 }} />
      <Skeleton width="100%" height={48} />
    </div>
  );
}
