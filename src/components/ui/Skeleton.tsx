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
