import { ApiError } from "@/helpers/api.helper";
import {
  LoginApiResponseSchema,
  type LoginResult,
} from "@/models/auth/login.model";
import {
  RefreshTokenApiResponseSchema,
  type RefreshTokenResult,
} from "@/models/auth/refresh-token.model";
import {
  LogoutApiResponseSchema,
  type LogoutResult,
} from "@/models/auth/logout.model";

export function normalizeLoginResponse(payload: unknown): LoginResult {
  const parsed = LoginApiResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new ApiError("استجابة تسجيل الدخول غير مطابقة للنموذج المتوقع.");
  }

  const root = parsed.data;

  if (root.success === false) {
    throw new ApiError(root.message ?? "بيانات تسجيل الدخول غير صحيحة.");
  }

  const nested = root.data;
  const accessToken =
    root.token ??
    root.accessToken ??
    root.access_token ??
    nested?.token ??
    nested?.accessToken ??
    nested?.access_token;

  if (!accessToken) {
    throw new ApiError("لم يرسل الخادم رمز تسجيل الدخول.");
  }

  const refreshToken =
    root.refreshToken ??
    root.refresh_token ??
    nested?.refreshToken ??
    nested?.refresh_token;

  if (!refreshToken) {
    throw new ApiError("لم يرسل الخادم رمز تحديث الجلسة.");
  }

  return {
    accessToken,
    refreshToken,
    user: root.user ?? nested?.user,
    message: root.message,
  };
}

export function normalizeRefreshTokenResponse(payload: unknown): RefreshTokenResult {
  const parsed = RefreshTokenApiResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new ApiError("استجابة تحديث الجلسة غير مطابقة للنموذج المتوقع.");
  }

  const root = parsed.data;
  if (root.success === false) {
    throw new ApiError(root.message ?? "تعذر تحديث جلسة تسجيل الدخول.");
  }

  const nested = root.data;
  const accessToken =
    root.token ??
    root.accessToken ??
    root.access_token ??
    nested?.token ??
    nested?.accessToken ??
    nested?.access_token;

  if (!accessToken) {
    throw new ApiError("لم يرسل الخادم رمز دخول جديداً.");
  }

  return {
    accessToken,
    refreshToken:
      root.refreshToken ??
      root.refresh_token ??
      nested?.refreshToken ??
      nested?.refresh_token,
    message: root.message,
  };
}

export function normalizeLogoutResponse(payload: unknown): LogoutResult {
  if (payload === null || payload === undefined || payload === "") return {};

  const parsed = LogoutApiResponseSchema.safeParse(payload);
  if (!parsed.success) return {};

  const root = parsed.data;
  if (root.success === false || root.data?.success === false) {
    throw new ApiError(
      root.message ?? root.data?.message ?? "تعذر تسجيل الخروج من الخادم.",
    );
  }

  return { message: root.message ?? root.data?.message };
}
