import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { confirmPayment, getMyPayments, getMyPayouts, getPayment, Payment } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const PAYMENT_KEY = ["payment"];
const MY_PAYMENTS_KEY = ["my-payments"];
const MY_PAYOUTS_KEY = ["my-payouts"];

export function usePayment(paymentId: string | undefined) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...PAYMENT_KEY, paymentId],
    queryFn: () => getPayment(token!, paymentId!),
    enabled: token !== null && Boolean(paymentId),
  });
}

export function useConfirmPayment() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentId: string) => confirmPayment(token!, paymentId),
    onSuccess: (payment: Payment) => {
      queryClient.setQueryData([...PAYMENT_KEY, payment.id], payment);
      queryClient.invalidateQueries({ queryKey: MY_PAYMENTS_KEY });
    },
  });
}

export function useMyPayments() {
  const { token } = useAuth();
  return useQuery({
    queryKey: MY_PAYMENTS_KEY,
    queryFn: () => getMyPayments(token!),
    enabled: token !== null,
  });
}

export function useMyPayouts() {
  const { token } = useAuth();
  return useQuery({
    queryKey: MY_PAYOUTS_KEY,
    queryFn: () => getMyPayouts(token!),
    enabled: token !== null,
  });
}
