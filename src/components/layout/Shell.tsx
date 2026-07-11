"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import {
  clearAuthSession,
  readAuthSession,
} from "@/helpers/auth-session.helper";
import { authService } from "@/services/auth.service";
import {
  canAccessRoute,
  defaultRouteForRole,
  normalizeRole,
} from "@/lib/auth/permissions";

/**
 * Authenticated app shell. Sidebar is fixed on the right (RTL);
 * content is offset by its width on large screens.
 */
export function Shell({ title = "نظرة عامة", children }: { title?: string; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSessionVerified, setIsSessionVerified] = useState(false);
  const [isRouteAllowed, setIsRouteAllowed] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function verifySession() {
      const session = readAuthSession();

      if (!session?.refreshToken) {
        clearAuthSession();
        router.replace("/login");
        return;
      }

      if (isActive) setIsSessionVerified(true);

      try {
        await authService.refresh({ refreshToken: session.refreshToken });
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

  // Role-based screen guard: block direct navigation to an unauthorized screen.
  useEffect(() => {
    if (!isSessionVerified) return;
    const role = normalizeRole(readAuthSession()?.role);
    if (!role) return;

    // The technician web dashboard was removed — end any technician session
    // instead of redirect-looping between screens they cannot open.
    if (role === "technician") {
      clearAuthSession();
      toast.error("لا صلاحية", "حسابات الفنيين تعمل عبر تطبيق الجوال فقط.");
      router.replace("/login");
      return;
    }

    if (canAccessRoute(role, pathname)) {
      setIsRouteAllowed(true);
      return;
    }

    setIsRouteAllowed(false);
    toast.error("لا صلاحية", "ليس لديك صلاحية للوصول إلى هذه الصفحة.");
    router.replace(defaultRouteForRole(role));
  }, [isSessionVerified, pathname, router, toast]);

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
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          {isRouteAllowed ? (
            children
          ) : (
            <div className="flex min-h-[60vh] items-center justify-center gap-3 text-sm text-content-muted">
              <Spinner />
              <span>ليس لديك صلاحية لهذه الصفحة، جارٍ إعادة التوجيه...</span>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
