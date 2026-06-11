"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { QueryProvider } from "@/providers/QueryProvider";

/**
 * Compose app-wide providers. In the full app this also wraps Auth + Socket
 * (see architecture §12). Mounted once near the root.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryProvider>{children}</QueryProvider>
    </ThemeProvider>
  );
}
