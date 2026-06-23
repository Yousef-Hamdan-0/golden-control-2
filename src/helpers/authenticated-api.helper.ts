import { ApiError, requestApi } from "@/helpers/api.helper";
import {
  clearAuthSession,
  getAccessToken,
} from "@/helpers/auth-session.helper";
import { authService } from "@/services/auth.service";

function requestWithAccessToken(
  url: string,
  options: RequestInit,
  accessToken: string | null,
) {
  if (!accessToken) {
    throw new ApiError("يجب تسجيل الدخول أولاً.", 401);
  }

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${accessToken}`);

  return requestApi(url, { ...options, headers });
}

function expireSession(): never {
  clearAuthSession();
  if (typeof window !== "undefined") window.location.replace("/login");
  throw new ApiError("انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.", 401);
}

/**
 * Sends an authenticated request and retries it once after refreshing an
 * expired access token. Concurrent 401 responses reuse authService's single
 * pending refresh request.
 */
export async function requestAuthenticatedApi(
  url: string,
  options: RequestInit,
): Promise<unknown> {
  const attemptedAccessToken = getAccessToken();

  try {
    return await requestWithAccessToken(url, options, attemptedAccessToken);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;

    // Another concurrent request may already have refreshed the session.
    const currentAccessToken = getAccessToken();
    if (currentAccessToken && currentAccessToken !== attemptedAccessToken) {
      return requestWithAccessToken(url, options, currentAccessToken);
    }

    try {
      await authService.refresh();
    } catch {
      return expireSession();
    }

    const refreshedAccessToken = getAccessToken();
    if (!refreshedAccessToken) return expireSession();

    try {
      return await requestWithAccessToken(url, options, refreshedAccessToken);
    } catch (retryError) {
      if (retryError instanceof ApiError && retryError.status === 401) {
        return expireSession();
      }
      throw retryError;
    }
  }
}
