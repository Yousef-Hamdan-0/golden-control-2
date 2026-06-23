import { z } from "zod";
import type { LoginRequest, LoginResult } from "@/models/auth/login.model";
import type { RefreshTokenResult } from "@/models/auth/refresh-token.model";

export const AUTH_SESSION_STORAGE_KEY = "golden-control:auth-session";
const LEGACY_SESSION_STORAGE_KEY = "golden-control:mock-session";

export const AuthSessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  email: z.string().email(),
  name: z.string(),
  role: z.string(),
  signedInAt: z.string(),
});

export type AuthSession = z.infer<typeof AuthSessionSchema>;

function printAccessToken(accessToken: string | null) {
  if (process.env.NODE_ENV !== "development") return;

  console.log("accessToken:", accessToken);
}

export function createAuthSession(
  result: LoginResult,
  request: Pick<LoginRequest, "email">,
): AuthSession {
  return {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    email: result.user?.email ?? request.email,
    name:
      result.user?.fullName ??
      result.user?.name ??
      request.email.split("@")[0] ??
      "المستخدم",
    role: result.user?.role ?? "Admin",
    signedInAt: new Date().toISOString(),
  };
}

export function readAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  const stored =
    window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY) ??
    window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);

  if (!stored) return null;

  try {
    return AuthSessionSchema.parse(JSON.parse(stored));
  } catch {
    clearAuthSession();
    return null;
  }
}

export function writeAuthSession(session: AuthSession, remember: boolean) {
  if (typeof window === "undefined") return;

  const storage = remember ? window.localStorage : window.sessionStorage;
  const otherStorage = remember ? window.sessionStorage : window.localStorage;

  otherStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
  window.sessionStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
  storage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function getAccessToken() {
  const accessToken = readAuthSession()?.accessToken ?? null;
  printAccessToken(accessToken);
  return accessToken;
}

export function getRefreshToken() {
  return readAuthSession()?.refreshToken ?? null;
}

export function updateAuthSessionTokens(result: RefreshTokenResult): AuthSession | null {
  if (typeof window === "undefined") return null;

  const session = readAuthSession();
  if (!session) return null;

  const updatedSession: AuthSession = {
    ...session,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken ?? session.refreshToken,
  };
  const remember = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY) !== null;
  writeAuthSession(updatedSession, remember);
  return updatedSession;
}

/** Reuse this helper in the next repositories that require authentication. */
export function getAuthorizationHeaders(): Record<string, string> {
  const accessToken = getAccessToken();
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
  window.sessionStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
}
