import { useQuery } from "@tanstack/react-query";
import { getAiNotesDelivery, getMyAiNotes } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const MY_AI_NOTES_KEY = ["ai-notes", "my"];
const AI_NOTES_DELIVERY_KEY = ["ai-notes", "delivery"];

export function useMyAiNotes() {
  const { token } = useAuth();
  return useQuery({
    queryKey: MY_AI_NOTES_KEY,
    queryFn: () => getMyAiNotes(token!),
    enabled: token !== null,
  });
}

export function useAiNotesDelivery(id: string | undefined) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...AI_NOTES_DELIVERY_KEY, id],
    queryFn: () => getAiNotesDelivery(token!, id!),
    enabled: token !== null && Boolean(id),
    // generation is async and can take a while -- poll every 5s while still pending/generating so
    // the viewer page updates itself once the delivery is sent, without a manual refresh
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" || status === "generated" ? 5000 : false;
    },
  });
}
