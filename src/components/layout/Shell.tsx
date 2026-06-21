"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Spinner } from "@/components/ui/Spinner";
import {
  clearAuthSession,
  readAuthSession,
} from "@/helpers/auth-session.helper";
import { authService } from "@/services/auth.service";

/**
 * Authenticated app shell. Sidebar is fixed on the right (RTL);
 * content is offset by its width on large screens.
 */
export function Shell({ title = "نظرة عامة", children }: { title?: string; children: ReactNode }) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSessionVerified, setIsSessionVerified] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function verifySession() {
      const session = readAuthSession();

      if (!session?.refreshToken) {
        clearAuthSession();
        router.replace("/login");
        return;
      }

      try {
        await authService.refresh({ refreshToken: session.refreshToken });
        if (isActive) setIsSessionVerified(true);
      } catch {
        clearAuthSession();
        if (isActive) router.replace("/login");
      }
    }

    void verifySession();

    return () => {
      isActive = false;
    };
  }, [router]);

  if (!isSessionVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 bg-bg text-sm text-content-muted">
        <Spinner />
        <span>جار التحقق من الجلسة...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-content">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="lg:mr-64">
        <Topbar title={title} onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
