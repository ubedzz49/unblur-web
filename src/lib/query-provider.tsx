"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            // data here changes from other people's actions (new doubts, incoming
            // requests, GD state) -- refetch on focus/reconnect and on an interval
            // so screens update on their own instead of needing a manual refresh
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            staleTime: 15_000,
            refetchInterval: 30_000,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
