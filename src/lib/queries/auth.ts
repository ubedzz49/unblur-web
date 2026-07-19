import { useMutation } from "@tanstack/react-query";
import { changePassword, loginWithPassword, sendOtp, verifyOtp } from "@/lib/api";

export function useSendOtp() {
  return useMutation({
    mutationFn: (identifier: string) => sendOtp(identifier),
  });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: ({ identifier, otp }: { identifier: string; otp: string }) => verifyOtp(identifier, otp),
  });
}

export function useLoginWithPassword() {
  return useMutation({
    mutationFn: ({ identifier, password }: { identifier: string; password: string }) =>
      loginWithPassword(identifier, password),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({
      token,
      newPassword,
      currentPassword,
    }: {
      token: string;
      newPassword: string;
      currentPassword?: string;
    }) => changePassword(token, newPassword, currentPassword),
  });
}
