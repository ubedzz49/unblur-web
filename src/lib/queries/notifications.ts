import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  GetNotificationsOptions,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const NOTIFICATIONS_KEY = ["notifications"];
const UNREAD_COUNT_KEY = ["notifications-unread-count"];

export function useNotifications(opts: GetNotificationsOptions = {}) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, opts.unread, opts.limit],
    queryFn: () => getNotifications(token!, opts),
    enabled: token !== null,
  });
}

export function useUnreadNotificationCount() {
  const { token } = useAuth();
  return useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: () => getUnreadNotificationCount(token!),
    enabled: token !== null,
  });
}

export function useMarkNotificationRead() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationRead(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsRead(token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
}
