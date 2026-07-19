import { useMutation } from "@tanstack/react-query";
import { sendOtp, verifyOtp } from "@/lib/api";

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
