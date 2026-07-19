import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMe,
  getMyStats,
  getPublicUser,
  ProfileUpdate,
  requestPhotoUploadUrl,
  updateMe,
  uploadFileToPresignedUrl,
  UserProfile,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const ME_QUERY_KEY = ["me"];
const PUBLIC_USER_KEY = ["public-user"];
const MY_STATS_KEY = ["my-stats"];

export function useMe() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: () => getMe(token!),
    enabled: token !== null,
  });
}

export function useUpdateProfile() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (update: ProfileUpdate) => updateMe(token!, update),
    onSuccess: (updated: UserProfile) => {
      queryClient.setQueryData(ME_QUERY_KEY, updated);
    },
  });
}

export function useUploadProfilePhoto() {
  const { token } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      const { uploadUrl, publicUrl } = await requestPhotoUploadUrl(token!, file.type);
      await uploadFileToPresignedUrl(uploadUrl, file);
      return publicUrl;
    },
  });
}

export function usePublicUser(userId: string | undefined) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...PUBLIC_USER_KEY, userId],
    queryFn: () => getPublicUser(token!, userId!),
    enabled: token !== null && Boolean(userId),
  });
}

export function useMyStats() {
  const { token } = useAuth();
  return useQuery({
    queryKey: MY_STATS_KEY,
    queryFn: () => getMyStats(token!),
    enabled: token !== null,
  });
}
