import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMe,
  ProfileUpdate,
  requestPhotoUploadUrl,
  updateMe,
  uploadFileToPresignedUrl,
  UserProfile,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const ME_QUERY_KEY = ["me"];

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
