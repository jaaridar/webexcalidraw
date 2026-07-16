"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";

// Mount-only wrapper: renders nothing during SSR and the first client render,
// then mounts children after useEffect. This completely avoids hydration
// mismatches caused by browser extensions that inject attributes into the DOM.
function MountedOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return mounted ? <>{children}</> : null;
}

// Lazy-load the sonner Toaster so it never touches the SSR tree.
const SonnerToaster = React.lazy(() =>
  import("sonner").then((m) => ({
    default: function S({ ...props }: React.ComponentProps<typeof m.Toaster>) {
      return <m.Toaster {...props} />;
    },
  }))
);

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            refetchOnWindowFocus: false,
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
        <MountedOnly>
          <React.Suspense fallback={null}>
            <SonnerToaster
              position="bottom-right"
              richColors
              closeButton
              toastOptions={{
                style: {
                  borderRadius: "0.75rem",
                },
              }}
            />
          </React.Suspense>
        </MountedOnly>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
