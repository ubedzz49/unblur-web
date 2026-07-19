"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useMe, useUpdateProfile, useUploadProfilePhoto } from "@/lib/queries/users";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { PageTransition } from "@/components/ui/PageTransition";
import shared from "../shared.module.css";
import styles from "./onboarding.module.css";

// name and photo now; first-expertise step is added here when expertise lands in V2
const TOTAL_STEPS = 2;

export default function OnboardingPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { showToast } = useToast();
  const me = useMe();
  const updateProfile = useUpdateProfile();
  const uploadPhoto = useUploadProfilePhoto();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  function finish() {
    router.replace("/home");
  }

  async function handleNameNext(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setStep(2);
      return;
    }
    setSavingName(true);
    try {
      await updateProfile.mutateAsync({ name: name.trim() });
      setStep(2);
    } catch {
      showToast("Couldn't save your name — try again.", "error");
    } finally {
      setSavingName(false);
    }
  }

  async function handlePhotoSelected(file: File) {
    try {
      const publicUrl = await uploadPhoto.mutateAsync(file);
      await updateProfile.mutateAsync({ photoUrl: publicUrl });
      showToast("Looking good!");
    } catch {
      showToast("Couldn't upload that photo — try again.", "error");
    }
  }

  if (!isLoggedIn) return null;

  return (
    <PageTransition className={shared.wrap}>
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <div className={styles.progress} aria-label={`Step ${step} of ${TOTAL_STEPS}`}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <span key={i} className={styles.progressStep} data-done={i < step} />
          ))}
        </div>

        {step === 1 && (
          <form onSubmit={handleNameNext}>
            <h1 className={styles.stepTitle}>Welcome to Unblur 👋</h1>
            <p className={styles.stepHint}>What should people call you?</p>
            <Input
              id="name"
              label="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Asha"
              autoFocus
            />
            <div className={styles.actions}>
              <Button type="submit" status={savingName ? "loading" : "idle"} loadingLabel="Saving…">
                Continue
              </Button>
              <button type="button" className={styles.skip} onClick={() => setStep(2)}>
                Skip for now
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div>
            <h1 className={styles.stepTitle}>Add a photo</h1>
            <p className={styles.stepHint}>Optional — it helps people recognize you in sessions.</p>
            <div className={styles.avatarWrap}>
              <Avatar
                photoUrl={me.data?.photoUrl ?? null}
                name={me.data?.name ?? name}
                uploading={uploadPhoto.isPending}
                onFileSelected={handlePhotoSelected}
                onInvalidFile={(message) => showToast(message, "error")}
              />
            </div>
            <div className={styles.actions}>
              <Button type="button" onClick={finish}>
                {me.data?.photoUrl ? "All set — take me in" : "Done"}
              </Button>
              {!me.data?.photoUrl && (
                <button type="button" className={styles.skip} onClick={finish}>
                  Skip for now
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
