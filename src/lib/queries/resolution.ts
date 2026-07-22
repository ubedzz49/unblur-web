import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptResolutionRequest,
  Booking,
  BookingRole,
  BookingStatus,
  cancelBooking,
  completeBooking,
  CreateResolutionRequestInput,
  createResolutionRequest,
  getBooking,
  getMyBookings,
  getResolutionRequests,
  rejectResolutionRequest,
  ResolutionRequestFilters,
  submitRating,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const RESOLUTION_REQUESTS_KEY = ["resolution-requests"];
const MY_BOOKINGS_KEY = ["my-bookings"];
const BOOKING_KEY = ["booking"];

export function useResolutionRequests(filters: ResolutionRequestFilters) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...RESOLUTION_REQUESTS_KEY, filters.doubtId, filters.resolverUserId, filters.status],
    queryFn: () => getResolutionRequests(token!, filters),
    enabled: token !== null && (Boolean(filters.doubtId) || Boolean(filters.resolverUserId)),
  });
}

// convenience alias -- most callers just want the requests for one doubt
export function useResolutionRequestsForDoubt(doubtId: string | undefined) {
  return useResolutionRequests({ doubtId });
}

export function useSendResolutionRequest() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateResolutionRequestInput) => createResolutionRequest(token!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESOLUTION_REQUESTS_KEY });
    },
  });
}

export function useAcceptResolutionRequest() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, chosenSlot }: { requestId: string; chosenSlot: string }) =>
      acceptResolutionRequest(token!, requestId, chosenSlot),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESOLUTION_REQUESTS_KEY });
      queryClient.invalidateQueries({ queryKey: MY_BOOKINGS_KEY });
    },
  });
}

export function useRejectResolutionRequest() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => rejectResolutionRequest(token!, requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESOLUTION_REQUESTS_KEY });
    },
  });
}

export function useMyBookings(role: BookingRole, status?: BookingStatus) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...MY_BOOKINGS_KEY, role, status],
    queryFn: () => getMyBookings(token!, role, status),
    enabled: token !== null,
  });
}

export function useBooking(bookingId: string | undefined) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...BOOKING_KEY, bookingId],
    queryFn: () => getBooking(token!, bookingId!),
    enabled: token !== null && Boolean(bookingId),
  });
}

export function useCompleteBooking() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => completeBooking(token!, bookingId),
    onSuccess: (booking: Booking) => {
      queryClient.setQueryData([...BOOKING_KEY, booking.id], booking);
      queryClient.invalidateQueries({ queryKey: MY_BOOKINGS_KEY });
    },
  });
}

export function useSubmitRating() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, rating, feedbackText }: { bookingId: string; rating: number; feedbackText?: string }) =>
      submitRating(token!, bookingId, rating, feedbackText),
    onSuccess: (_rating, variables) => {
      queryClient.invalidateQueries({ queryKey: [...BOOKING_KEY, variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: MY_BOOKINGS_KEY });
    },
  });
}

export function useCancelBooking() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => cancelBooking(token!, bookingId),
    onSuccess: (booking: Booking) => {
      queryClient.setQueryData([...BOOKING_KEY, booking.id], booking);
      queryClient.invalidateQueries({ queryKey: MY_BOOKINGS_KEY });
    },
  });
}
