import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addMyExpertise, getExpertiseOptions, getMyExpertise, removeMyExpertise } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const MY_EXPERTISE_KEY = ["my-expertise"];

export function useExpertiseOptions() {
  return useQuery({
    queryKey: ["expertise-options"],
    queryFn: getExpertiseOptions,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMyExpertise() {
  const { token } = useAuth();
  return useQuery({
    queryKey: MY_EXPERTISE_KEY,
    queryFn: () => getMyExpertise(token!),
    enabled: token !== null,
  });
}

export function useAddExpertise() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ expertiseTypeId, expertiseLevelId }: { expertiseTypeId: string; expertiseLevelId: string }) =>
      addMyExpertise(token!, expertiseTypeId, expertiseLevelId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MY_EXPERTISE_KEY }),
  });
}

export function useRemoveExpertise() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userExpertiseId: string) => removeMyExpertise(token!, userExpertiseId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MY_EXPERTISE_KEY }),
  });
}
