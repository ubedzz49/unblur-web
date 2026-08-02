import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createGd, getGd, getGdEligibility, getGdJoinUrl, getGdResults, getGds, joinGd, voteInGd } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const GDS_KEY = ["gds"];
const GD_KEY = ["gd"];

export function useGdEligibility() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["gd-eligibility"],
    queryFn: () => getGdEligibility(token!),
    enabled: token !== null,
  });
}

export function useGds(upcoming = true) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...GDS_KEY, upcoming],
    queryFn: () => getGds(token!, { upcoming }),
    enabled: token !== null,
  });
}

export function useGd(id: string | undefined) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...GD_KEY, id],
    queryFn: () => getGd(token!, id!),
    enabled: token !== null && Boolean(id),
  });
}

export function useCreateGd() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { topic: string; scheduledAt: string; durationMins: number; entryFeeCents: number }) => createGd(token!, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GDS_KEY }),
  });
}

export function useJoinGd(gdId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => joinGd(token!, gdId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...GD_KEY, gdId] }),
  });
}

export function useGdJoinUrl(gdId: string) {
  const { token } = useAuth();
  return useMutation({
    mutationFn: () => getGdJoinUrl(token!, gdId),
  });
}

export function useVoteInGd(gdId: string) {
  const { token } = useAuth();
  return useMutation({
    mutationFn: (input: { firstUserId: string; secondUserId: string; thirdUserId: string }) =>
      voteInGd(token!, gdId, input.firstUserId, input.secondUserId, input.thirdUserId),
  });
}

export function useGdResults(gdId: string | undefined, enabled: boolean) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...GD_KEY, gdId, "results"],
    queryFn: () => getGdResults(token!, gdId!),
    enabled: token !== null && Boolean(gdId) && enabled,
  });
}
