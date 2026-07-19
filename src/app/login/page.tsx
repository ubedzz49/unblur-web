"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useSendOtp, useVerifyOtp, useLoginWithPassword } from "@/lib/queries/auth";
import { savePendingToken } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { PageTransition } from "@/components/ui/PageTransition";
import { SiteHeader } from "../site-header";
import shared from "../shared.module.css";
import styles from "./login.module.css";

type Mode = "otp" | "password";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { showToast } = useToast();
  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();
  const loginWithPassword = useLoginWithPassword();

  const [mode, setMode] = useState<Mode>("otp");

  const [step, setStep] = useState<"identifier" | "otp">("identifier");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const [passwordIdentifier, setPasswordIdentifier] = useState("");
  const [password, setPassword] = useState("");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await sendOtp.mutateAsync(identifier);
      setDevOtp(res.otp ?? null);
      setStep("otp");
    } catch {
      showToast("Couldn't send a code — check the address and try again.", "error");
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await verifyOtp.mutateAsync({ identifier, otp });
      login(res.token);
      // new accounts get a short onboarding; returning users land on their home screen
      if (res.isNewUser) {
        router.push("/onboarding");
      } else {
        showToast("Logged in");
        router.push("/home");
      }
    } catch {
      showToast("That code didn't work — check it and try again.", "error");
    }
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await loginWithPassword.mutateAsync({
        identifier: passwordIdentifier,
        password,
      });
      if (res.mustResetPassword) {
        // Don't finalize login yet -- hold the token for the one authenticated call the
        // change-password screen needs to make, and force the user through that screen
        // before they can reach anything under the app shell.
        savePendingToken(res.token);
        router.push("/change-password");
      } else {
        login(res.token);
        showToast("Logged in");
        router.push("/home");
      }
    } catch {
      showToast("That email/phone or password didn't work — check it and try again.", "error");
    }
  }

  return (
    <PageTransition className={shared.wrap}>
      <SiteHeader />
      <section style={{ padding: "40px 0" }}>
        <h1 className={shared.heading}>Log in to Unblur</h1>
        <p className={shared.muted} style={{ marginBottom: 24 }}>
          Use the email or phone you post doubts with.
        </p>

        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "otp"}
            className={styles.tab}
            data-active={mode === "otp"}
            onClick={() => setMode("otp")}
          >
            Email code
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "password"}
            className={styles.tab}
            data-active={mode === "password"}
            onClick={() => setMode("password")}
          >
            Password
          </button>
        </div>

        <Card style={{ maxWidth: 380 }}>
          {mode === "otp" && step === "identifier" && (
            <form onSubmit={handleSend}>
              <Input
                id="identifier"
                label="Email or phone"
                placeholder="you@school.edu"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                required
              />
              <Button type="submit" status={sendOtp.isPending ? "loading" : "idle"} loadingLabel="Sending…">
                Send code
              </Button>
            </form>
          )}

          {mode === "otp" && step === "otp" && (
            <form onSubmit={handleVerify}>
              <p className={shared.muted} style={{ marginBottom: 14 }}>
                Code sent to {identifier}.
              </p>
              {devOtp && (
                <p className={shared.muted} style={{ marginBottom: 14 }}>
                  (dev only — code is {devOtp})
                </p>
              )}
              <Input
                id="otp"
                label="6-digit code"
                placeholder="000000"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                autoComplete="one-time-code"
                required
              />
              <Button
                type="submit"
                status={verifyOtp.isPending ? "loading" : "idle"}
                loadingLabel="Verifying…"
              >
                Verify and continue
              </Button>
              <Button
                type="button"
                variant="secondary"
                style={{ marginTop: 10 }}
                onClick={() => {
                  setStep("identifier");
                  setOtp("");
                }}
              >
                Use a different email or phone
              </Button>
            </form>
          )}

          {mode === "password" && (
            <form onSubmit={handlePasswordLogin}>
              <Input
                id="password-identifier"
                label="Email or phone"
                placeholder="you@school.edu"
                value={passwordIdentifier}
                onChange={(e) => setPasswordIdentifier(e.target.value)}
                autoComplete="username"
                required
              />
              <Input
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <Button
                type="submit"
                status={loginWithPassword.isPending ? "loading" : "idle"}
                loadingLabel="Logging in…"
              >
                Log in
              </Button>
            </form>
          )}
        </Card>
      </section>
    </PageTransition>
  );
}
