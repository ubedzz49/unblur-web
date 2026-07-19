"use client";

import { InputHTMLAttributes } from "react";
import styles from "./Input.module.css";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, className, ...rest }: InputProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={[styles.input, error ? styles.inputError : "", className].filter(Boolean).join(" ")}
        aria-invalid={Boolean(error)}
        {...rest}
      />
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  );
}
