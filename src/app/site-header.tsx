import Link from "next/link";
import styles from "./site-header.module.css";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        UNBLUR
      </Link>
      <ThemeToggle />
    </header>
  );
}
