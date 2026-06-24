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

function extractBlobErrorMessage(payload: unknown): string | undefined {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return undefined;
  }

  const record = payload as Record<string, unknown>;
  const directMessage = record.message ?? record.error;
  if (typeof directMessage === "string" && directMessage.trim()) {
    return directMessage;
  }

  const data = record.data;
  if (typeof data === "object" && data !== null && !Array.isArray(data)) {
    const dataRecord = data as Record<string, unknown>;
    const nestedMessage = dataRecord.message ?? dataRecord.error;
    if (typeof nestedMessage === "string" && nestedMessage.trim()) {
      return nestedMessage;
    }
  }

  return undefined;
}

function fileNameFromDisposition(value: string | null) {
  if (!value) return undefined;
  const encodedMatch = /filename\*=UTF-8''([^;]+)/i.exec(value);
  if (encodedMatch) return decodeURIComponent(encodedMatch[1].replace(/"/g, ""));

  const plainMatch = /filename="?([^";]+)"?/i.exec(value);
  return plainMatch?.[1];
}

export interface AuthenticatedBlobResponse {
  blob: Blob;
  fileName?: string;
  contentType: string;
}

async function requestBlobWithAccessToken(
  url: string,
  options: RequestInit,
  accessToken: string | null,
): Promise<AuthenticatedBlobResponse> {
  if (!accessToken) {
    throw new ApiError("يجب تسجيل الدخول أولاً.", 401);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);

  try {
    const response = await fetch(url, { ...options, headers, signal: controller.signal });

    if (!response.ok) {
      const rawBody = await response.text();
      let payload: unknown = rawBody;
      if (rawBody) {
        try {
          payload = JSON.parse(rawBody);
        } catch {
          payload = rawBody;
        }
      }

      throw new ApiError(
        extractBlobErrorMessage(payload) ?? "تعذر إكمال الطلب من الخادم.",
        response.status,
        payload,
      );
    }

    return {
      blob: await response.blob(),
      fileName: fileNameFromDisposition(response.headers.get("content-disposition")),
      contentType: response.headers.get("content-type") ?? "application/octet-stream",
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("انتهت مهلة الاتصال بالخادم. حاول مرة أخرى.");
    }

    throw new ApiError("تعذر الاتصال بالخادم. تحقق من رابط الـ API والاتصال بالشبكة.");
  } finally {
    clearTimeout(timeoutId);
  }
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

export async function requestAuthenticatedBlob(
  url: string,
  options: RequestInit,
): Promise<AuthenticatedBlobResponse> {
  const attemptedAccessToken = getAccessToken();

  try {
    return await requestBlobWithAccessToken(url, options, attemptedAccessToken);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;

    const currentAccessToken = getAccessToken();
    if (currentAccessToken && currentAccessToken !== attemptedAccessToken) {
      return requestBlobWithAccessToken(url, options, currentAccessToken);
    }

    try {
      await authService.refresh();
    } catch {
      return expireSession();
    }

    const refreshedAccessToken = getAccessToken();
    if (!refreshedAccessToken) return expireSession();

    try {
      return await requestBlobWithAccessToken(url, options, refreshedAccessToken);
    } catch (retryError) {
      if (retryError instanceof ApiError && retryError.status === 401) {
        return expireSession();
      }
      throw retryError;
    }
  }
}
