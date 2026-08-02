import styles from "./LiveDot.module.css";

export function LiveDot() {
  return (
    <span className={styles.wrap} aria-hidden="true">
      <span className={styles.ping} />
      <span className={styles.dot} />
    </span>
  );
}
