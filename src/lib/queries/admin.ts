import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addAdminExpertise,
  AiNotesDeliveryStatus,
  blockAdminUser,
  cancelGdAsAdmin,
  cancelSeminarAsAdmin,
  ComplaintOutcome,
  ComplaintStatus,
  getAdminAiNotes,
  getAdminComplaints,
  getAdminComplaintRecording,
  getAdminGds,
  getAdminSeminars,
  getAdminUsers,
  getExpertiseOptions,
  importAdminExpertise,
  refundBookingAsAdmin,
  removeAdminExpertise,
  resolveAdminComplaint,
  retryAdminAiNotes,
  sendAdminNotification,
  unblockAdminUser,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const ADMIN_USERS_KEY = ["admin", "users"];
const ADMIN_COMPLAINTS_KEY = ["admin", "complaints"];
const ADMIN_AI_NOTES_KEY = ["admin", "ai-notes"];
const ADMIN_SEMINARS_KEY = ["admin", "seminars"];
const ADMIN_GDS_KEY = ["admin", "gds"];

export function useAdminSeminars() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ADMIN_SEMINARS_KEY,
    queryFn: () => getAdminSeminars(token!),
    enabled: token !== null,
  });
}

export function useCancelSeminarAsAdmin() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelSeminarAsAdmin(token!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_SEMINARS_KEY }),
  });
}

export function useAdminGds() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ADMIN_GDS_KEY,
    queryFn: () => getAdminGds(token!),
    enabled: token !== null,
  });
}

export function useCancelGdAsAdmin() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelGdAsAdmin(token!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_GDS_KEY }),
  });
}

export function useAdminUsers() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ADMIN_USERS_KEY,
    queryFn: () => getAdminUsers(token!),
    enabled: token !== null,
  });
}

export function useBlockAdminUser() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => blockAdminUser(token!, email),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEY }),
  });
}

export function useUnblockAdminUser() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => unblockAdminUser(token!, email),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEY }),
  });
}

export function useAdminComplaints(status?: ComplaintStatus) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...ADMIN_COMPLAINTS_KEY, status],
    queryFn: () => getAdminComplaints(token!, status),
    enabled: token !== null,
  });
}

export function useResolveAdminComplaint() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ complaintId, outcome }: { complaintId: string; outcome: ComplaintOutcome }) =>
      resolveAdminComplaint(token!, complaintId, outcome),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_COMPLAINTS_KEY }),
  });
}

export function useAdminComplaintRecording() {
  const { token } = useAuth();
  return useMutation({
    mutationFn: (complaintId: string) => getAdminComplaintRecording(token!, complaintId),
  });
}

export function useRefundBookingAsAdmin() {
  const { token } = useAuth();
  return useMutation({
    mutationFn: (bookingId: string) => refundBookingAsAdmin(token!, bookingId),
  });
}

export function useSendAdminNotification() {
  const { token } = useAuth();
  return useMutation({
    mutationFn: ({ userId, title, body }: { userId: string; title: string; body?: string }) =>
      sendAdminNotification(token!, userId, title, body),
  });
}

// reuses the public (already-existing) expertise-options list -- the admin dashboard just needs
// to show what topics exist today, no separate admin-only listing endpoint was built for that
export function useAdminExpertiseOptions() {
  return useQuery({
    queryKey: ["expertise-options"],
    queryFn: () => getExpertiseOptions(),
  });
}

export function useAddAdminExpertise() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subjectName, levelName }: { subjectName: string; levelName?: string }) =>
      addAdminExpertise(token!, subjectName, levelName),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expertise-options"] }),
  });
}

export function useImportAdminExpertise() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (nodes: { subjectName: string; levelName?: string }[]) => importAdminExpertise(token!, nodes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expertise-options"] }),
  });
}

export function useAdminAiNotes(status?: AiNotesDeliveryStatus) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...ADMIN_AI_NOTES_KEY, status],
    queryFn: () => getAdminAiNotes(token!, status),
    enabled: token !== null,
  });
}

export function useRetryAdminAiNotes() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => retryAdminAiNotes(token!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_AI_NOTES_KEY }),
  });
}

export function useRemoveAdminExpertise() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expertiseLevelId: string) => removeAdminExpertise(token!, expertiseLevelId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expertise-options"] }),
  });
}
