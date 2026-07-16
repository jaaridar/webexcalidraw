"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            refetchOnWindowFocus: false,
            // Don't retry 4xx client errors (401/403/404 etc.) — they won't
            // succeed on retry and just surface as console noise.
            retry: (failureCount, error: unknown) => {
              const msg = error instanceof Error ? error.message : "";
              if (
                msg === "Unauthorized" ||
                msg === "Forbidden" ||
                msg === "Not found" ||
                msg === "Read-only access" ||
                msg === "Incorrect password" ||
                msg === "Password required"
              ) {
                return false;
              }
              return failureCount < 1;
            },
          },
          mutations: {
            retry: false,
          },
        },
      })
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={client}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
