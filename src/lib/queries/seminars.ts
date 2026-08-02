import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSeminar,
  getSeminar,
  getSeminarEligibility,
  getSeminarJoinUrl,
  getSeminars,
  registerForSeminar,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const SEMINARS_KEY = ["seminars"];
const SEMINAR_KEY = ["seminar"];

export function useSeminarEligibility() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["seminar-eligibility"],
    queryFn: () => getSeminarEligibility(token!),
    enabled: token !== null,
  });
}

export function useSeminars(upcoming = true) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...SEMINARS_KEY, upcoming],
    queryFn: () => getSeminars(token!, { upcoming }),
    enabled: token !== null,
  });
}

export function useSeminar(id: string | undefined) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...SEMINAR_KEY, id],
    queryFn: () => getSeminar(token!, id!),
    enabled: token !== null && Boolean(id),
  });
}

export function useCreateSeminar() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; description?: string; scheduledAt: string; durationMins: number; entryFeeCents: number }) =>
      createSeminar(token!, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SEMINARS_KEY }),
  });
}

export function useRegisterForSeminar(seminarId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => registerForSeminar(token!, seminarId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...SEMINAR_KEY, seminarId] }),
  });
}

export function useSeminarJoinUrl(seminarId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => getSeminarJoinUrl(token!, seminarId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...SEMINAR_KEY, seminarId] }),
  });
}
