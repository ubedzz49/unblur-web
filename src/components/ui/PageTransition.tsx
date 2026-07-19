import { HTMLAttributes } from "react";
import styles from "./PageTransition.module.css";

export function PageTransition({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={[styles.enter, className].filter(Boolean).join(" ")} {...rest} />;
}
