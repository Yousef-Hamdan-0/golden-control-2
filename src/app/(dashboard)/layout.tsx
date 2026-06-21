import type { ReactNode } from "react";
import { Shell } from "@/components/layout/Shell";

/** Authenticated shell for all dashboard routes. */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <Shell>{children}</Shell>;
}
