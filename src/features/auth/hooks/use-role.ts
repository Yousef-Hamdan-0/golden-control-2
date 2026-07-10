"use client";

import { useEffect, useState } from "react";
import { normalizeRole } from "@/lib/auth/permissions";
import type { Role } from "@/lib/auth/permissions";
import { readAuthSession, type AuthSession } from "@/helpers/auth-session.helper";
import { useCurrentUserQuery } from "@/features/users/hooks/use-users-query";

/**
 * Client-side role of the signed-in user: prefers the fresh /users/me profile
 * and falls back to the stored auth session (read in an effect for SSR safety).
 * Single source used by the sidebar and every screen that gates actions.
 */
export function useRole(): { role: Role | null; isReady: boolean } {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isSessionRead, setIsSessionRead] = useState(false);
  const currentUserQuery = useCurrentUserQuery();

  useEffect(() => {
    setSession(readAuthSession());
    setIsSessionRead(true);
  }, []);

  const role = normalizeRole(currentUserQuery.data?.role ?? session?.role);
  return { role, isReady: isSessionRead || Boolean(currentUserQuery.data) };
}
