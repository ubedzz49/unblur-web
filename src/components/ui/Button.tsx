"use client";

import { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

export type ButtonStatus = "idle" | "loading" | "success";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  status?: ButtonStatus;
  loadingLabel?: string;
  successLabel?: string;
}

export function Button({
  variant = "primary",
  status = "idle",
  loadingLabel,
  successLabel,
  children,
  disabled,
  className,
  ...rest
}: ButtonProps) {
  const variantClass = variant === "primary" ? styles.primary : styles.secondary;

  return (
    <button
      className={[styles.button, variantClass, className].filter(Boolean).join(" ")}
      disabled={disabled || status === "loading"}
      {...rest}
    >
      {status === "loading" && (
        <>
          <span className={styles.spinner} aria-hidden="true" />
          {loadingLabel ?? children}
        </>
      )}
      {status === "success" && (
        <>
          <span className={styles.checkmark} aria-hidden="true">
            ✓
          </span>
          {successLabel ?? children}
        </>
      )}
      {status === "idle" && children}
    </button>
  );
}
