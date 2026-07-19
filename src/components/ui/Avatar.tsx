"use client";

import Image from "next/image";
import { ChangeEvent, useId, useRef } from "react";
import styles from "./Avatar.module.css";

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface AvatarProps {
  photoUrl: string | null;
  name: string | null;
  uploading: boolean;
  onFileSelected: (file: File) => void;
  onInvalidFile: (message: string) => void;
}

function initialsFor(name: string | null): string {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase();
}

export function Avatar({ photoUrl, name, uploading, onFileSelected, onInvalidFile }: AvatarProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      onInvalidFile("Please choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      onInvalidFile("That image is too large — please choose one under 5MB.");
      return;
    }
    onFileSelected(file);
  }

  return (
    <div className={styles.wrap}>
      {photoUrl ? (
        <Image src={photoUrl} alt="" width={88} height={88} className={styles.circle} unoptimized />
      ) : (
        <div className={styles.circle}>{initialsFor(name)}</div>
      )}

      {uploading && (
        <div className={styles.overlay}>
          <span className={styles.spinner} aria-hidden="true" />
        </div>
      )}

      <label className={styles.editButton} htmlFor={inputId}>
        ✎<span className={styles.hiddenInput}>Change photo</span>
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ALLOWED_PHOTO_TYPES.join(",")}
        className={styles.hiddenInput}
        onChange={handleChange}
        disabled={uploading}
      />
    </div>
  );
}
