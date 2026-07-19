import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateDoubtInput, createDoubt, getFeed, getMyDoubts } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const FEED_KEY = ["feed"];
const MY_DOUBTS_KEY = ["my-doubts"];

export function useFeed(expertiseLevelIds: string[]) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...FEED_KEY, ...expertiseLevelIds.slice().sort()],
    queryFn: () => getFeed(token!, expertiseLevelIds),
    enabled: token !== null && expertiseLevelIds.length > 0,
  });
}

export function useCreateDoubt() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDoubtInput) => createDoubt(token!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEED_KEY });
      queryClient.invalidateQueries({ queryKey: MY_DOUBTS_KEY });
    },
  });
}

export function useMyDoubts(authorUserId: string | undefined) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...MY_DOUBTS_KEY, authorUserId],
    queryFn: () => getMyDoubts(token!, authorUserId!),
    enabled: token !== null && Boolean(authorUserId),
  });
}
