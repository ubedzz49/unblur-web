import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateDoubtInput, createDoubt, getFeed, getMyDoubts } from "@/lib/api";

const FEED_KEY = ["feed"];
const MY_DOUBTS_KEY = ["my-doubts"];

export function useFeed(expertiseLevelIds: string[]) {
  return useQuery({
    queryKey: [...FEED_KEY, ...expertiseLevelIds.slice().sort()],
    queryFn: () => getFeed(expertiseLevelIds),
    enabled: expertiseLevelIds.length > 0,
  });
}

export function useCreateDoubt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDoubtInput) => createDoubt(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEED_KEY });
      queryClient.invalidateQueries({ queryKey: MY_DOUBTS_KEY });
    },
  });
}

export function useMyDoubts(authorUserId: string | undefined) {
  return useQuery({
    queryKey: [...MY_DOUBTS_KEY, authorUserId],
    queryFn: () => getMyDoubts(authorUserId!),
    enabled: Boolean(authorUserId),
  });
}
