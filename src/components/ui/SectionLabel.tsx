import { ReactNode } from "react";
import styles from "./SectionLabel.module.css";

export function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className={styles.row}>
      <h2 className={styles.label}>{children}</h2>
      {action}
    </div>
  );
}
