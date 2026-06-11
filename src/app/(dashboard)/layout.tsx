import type { ReactNode } from "react";
import { Shell } from "@/components/layout/Shell";

/**
 * Authenticated shell for all (dashboard) routes.
 * NOTE: when NextAuth is wired in, validate the session here and redirect
 * unauthenticated users (defense-in-depth alongside middleware.ts).
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <Shell>{children}</Shell>;
}
