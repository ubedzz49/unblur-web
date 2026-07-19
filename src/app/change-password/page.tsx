"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getPendingToken, clearPendingToken } from "@/lib/auth";
import { useChangePassword } from "@/lib/queries/auth";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { PageTransition } from "@/components/ui/PageTransition";
import shared from "../shared.module.css";

const MIN_PASSWORD_LENGTH = 8;

export default function ChangePasswordPage() {
  const router = useRouter();
  const { token, login } = useAuth();
  const { showToast } = useToast();
  const changePassword = useChangePassword();

  // A forced reset arrives with a pending token (set right after password login, before the
  // real login() call) instead of an AuthProvider token. A voluntary change (from /profile)
  // arrives already logged in, so `token` is already set.
  const [pendingToken] = useState(() => getPendingToken());
  const forced = pendingToken !== null;
  const activeToken = token ?? pendingToken;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    // Neither a real session nor a pending one -- nothing to do here.
    if (!activeToken) router.replace("/login");
  }, [activeToken, router]);

  const newPasswordTooShort = newPassword.length > 0 && newPassword.length < MIN_PASSWORD_LENGTH;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmit = useMemo(
    () =>
      newPassword.length >= MIN_PASSWORD_LENGTH &&
      newPassword === confirmPassword &&
      !changePassword.isPending,
    [newPassword, confirmPassword, changePassword.isPending],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !activeToken) return;

    try {
      await changePassword.mutateAsync({
        token: activeToken,
        newPassword,
        currentPassword: currentPassword || undefined,
      });

      if (forced) {
        login(activeToken);
        clearPendingToken();
      }

      showToast("Password changed");
      router.push("/home");
    } catch {
      showToast("Couldn't change your password — check your current password and try again.", "error");
    }
  }

  if (!activeToken) return null;

  return (
    <PageTransition className={shared.wrap}>
      <section style={{ padding: "40px 0" }}>
        <h1 className={shared.heading}>{forced ? "Set a new password" : "Change your password"}</h1>
        <p className={shared.muted} style={{ marginBottom: 24 }}>
          {forced
            ? "Your account was set up with a temporary password — set a new one to continue."
            : "Update the password used to log in with your email or phone."}
        </p>

        <Card style={{ maxWidth: 380 }}>
          <form onSubmit={handleSubmit}>
            <Input
              id="currentPassword"
              label={forced ? "Current (temporary) password" : "Current password (leave blank if you don't have one yet)"}
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required={forced}
            />
            <Input
              id="newPassword"
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              error={newPasswordTooShort ? `Must be at least ${MIN_PASSWORD_LENGTH} characters` : undefined}
              required
            />
            <Input
              id="confirmPassword"
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              error={passwordsMismatch ? "Passwords don't match" : undefined}
              required
            />
            <Button
              type="submit"
              status={changePassword.isPending ? "loading" : "idle"}
              loadingLabel="Saving…"
              disabled={!canSubmit}
            >
              Save new password
            </Button>
          </form>
        </Card>
      </section>
    </PageTransition>
  );
}
