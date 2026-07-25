import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fileComplaint, getComplaint } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const COMPLAINT_KEY = ["complaint"];

export function useComplaint(bookingId: string | undefined) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...COMPLAINT_KEY, bookingId],
    queryFn: () => getComplaint(token!, bookingId!),
    enabled: token !== null && Boolean(bookingId),
  });
}

export function useFileComplaint() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason: string }) => fileComplaint(token!, bookingId, reason),
    onSuccess: (_, { bookingId }) => {
      queryClient.invalidateQueries({ queryKey: [...COMPLAINT_KEY, bookingId] });
    },
  });
}
