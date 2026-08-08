"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useSendOtp, useVerifyOtp, useLoginWithPassword } from "@/lib/queries/auth";
import { savePendingToken } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { Logo } from "@/components/Logo";

type Mode = "otp" | "password";

const fieldLabelStyle: React.CSSProperties = { fontSize: 12.5, color: "var(--dim)", display: "block", marginBottom: 8 };
const fieldInputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: 10,
  padding: "13px 14px",
  color: "var(--paper)",
  fontSize: 14,
};
const btnPrimaryStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--violet)",
  color: "var(--ink-strong)",
  border: "none",
  padding: 14,
  borderRadius: 10,
  fontWeight: 600,
  fontSize: 14.5,
  cursor: "pointer",
  marginTop: 8,
};

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
      const res = await loginWithPassword.mutateAsync({ identifier: passwordIdentifier, password });
      if (res.isAdmin) {
        login(res.token);
        router.push("/admin");
      } else if (res.mustResetPassword) {
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
    <div className="flex min-h-dvh items-center justify-center px-6 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-9 flex items-center justify-center gap-2 text-[19px] font-bold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          <Logo size={16} />
          unblur
        </div>
        <h1 className="mb-2 text-center text-[26px] font-semibold" style={{ fontFamily: "var(--font-fraunces)" }}>Welcome back</h1>
        <p className="mb-8 text-center text-sm" style={{ color: "var(--dim)" }}>Sign in to keep resolving, or post your first doubt.</p>

        <div className="mb-6 flex rounded-[10px] border p-1" style={{ borderColor: "var(--line)", background: "var(--surface)" }} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "otp"}
            onClick={() => setMode("otp")}
            className="flex-1 rounded-lg py-2.5 text-[13.5px]"
            style={mode === "otp" ? { background: "var(--violet)", color: "var(--ink-strong)", fontWeight: 600 } : { color: "var(--dim)" }}
          >
            Phone or email
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "password"}
            onClick={() => setMode("password")}
            className="flex-1 rounded-lg py-2.5 text-[13.5px]"
            style={mode === "password" ? { background: "var(--violet)", color: "var(--ink-strong)", fontWeight: 600 } : { color: "var(--dim)" }}
          >
            Password
          </button>
        </div>

        {mode === "otp" && step === "identifier" && (
          <form onSubmit={handleSend}>
            <div className="mb-4">
              <label htmlFor="identifier" style={fieldLabelStyle}>Email or phone</label>
              <input
                id="identifier"
                style={fieldInputStyle}
                placeholder="98765 43210 or you@email.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <button type="submit" style={btnPrimaryStyle} disabled={sendOtp.isPending}>
              {sendOtp.isPending ? "Sending…" : "Send code"}
            </button>
          </form>
        )}

        {mode === "otp" && step === "otp" && (
          <form onSubmit={handleVerify} style={{ marginTop: 8 }}>
            <p className="mb-3.5 text-sm" style={{ color: "var(--dim)" }}>Code sent to {identifier}.</p>
            {devOtp && <p className="mb-3.5 text-sm" style={{ color: "var(--dim)" }}>(dev only — code is {devOtp})</p>}
            <div className="mb-4">
              <label htmlFor="otp" style={fieldLabelStyle}>6-digit code</label>
              <input
                id="otp"
                style={{ ...fieldInputStyle, letterSpacing: "0.4em", textAlign: "center", fontSize: 18 }}
                placeholder="000000"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                autoComplete="one-time-code"
                required
              />
            </div>
            <button type="submit" style={btnPrimaryStyle} disabled={verifyOtp.isPending}>
              {verifyOtp.isPending ? "Verifying…" : "Verify and continue"}
            </button>
            <div className="mt-3.5 text-center text-[12.5px]" style={{ color: "var(--dim)" }}>
              Did not get it.{" "}
              <button
                type="button"
                onClick={() => {
                  setStep("identifier");
                  setOtp("");
                }}
                style={{ color: "var(--violet)", fontWeight: 600 }}
              >
                Use a different email or phone
              </button>
            </div>
          </form>
        )}

        {mode === "password" && (
          <form onSubmit={handlePasswordLogin}>
            <div className="mb-4">
              <label htmlFor="password-identifier" style={fieldLabelStyle}>Email or phone</label>
              <input
                id="password-identifier"
                style={fieldInputStyle}
                placeholder="you@email.com"
                value={passwordIdentifier}
                onChange={(e) => setPasswordIdentifier(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" style={fieldLabelStyle}>Password</label>
              <input
                id="password"
                type="password"
                style={fieldInputStyle}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <button type="submit" style={btnPrimaryStyle} disabled={loginWithPassword.isPending}>
              {loginWithPassword.isPending ? "Logging in…" : "Log in"}
            </button>
          </form>
        )}

        <div className="my-5.5 flex items-center gap-3 text-xs" style={{ color: "var(--dim)" }}>
          <span className="h-px flex-1" style={{ background: "var(--line)" }} />
          or
          <span className="h-px flex-1" style={{ background: "var(--line)" }} />
        </div>
        <div className="text-center text-[13px]" style={{ color: "var(--dim)" }}>
          New here. <span style={{ color: "var(--violet)" }}>Create an account, it takes a minute</span>
        </div>
      </div>
    </div>
  );
}
