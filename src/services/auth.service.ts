import {
  clearAuthSession,
  createAuthSession,
  getRefreshToken,
  updateAuthSessionTokens,
  writeAuthSession,
} from "@/helpers/auth-session.helper";
import { ApiError } from "@/helpers/api.helper";
import type { LoginRequest } from "@/models/auth/login.model";
import type {
  RefreshTokenRequest,
  RefreshTokenResult,
} from "@/models/auth/refresh-token.model";
import type { LogoutRequest } from "@/models/auth/logout.model";
import { authRepository } from "@/repositories/auth.repository";

let pendingRefreshRequest: Promise<RefreshTokenResult> | null = null;

export const authService = {
  async login(input: LoginRequest, remember: boolean) {
    const result = await authRepository.login(input);
    const session = createAuthSession(result, input);
    writeAuthSession(session, remember);
    return session;
  },

  async refresh(input?: RefreshTokenRequest) {
    const refreshToken = input?.refreshToken ?? getRefreshToken();
    if (!refreshToken) {
      throw new ApiError("لا توجد جلسة قابلة للتحديث. يرجى تسجيل الدخول مجدداً.");
    }

    if (!pendingRefreshRequest) {
      pendingRefreshRequest = authRepository
        .refresh({ refreshToken })
        .then((result) => {
          updateAuthSessionTokens(result);
          return result;
        })
        .finally(() => {
          pendingRefreshRequest = null;
        });
    }

    return pendingRefreshRequest;
  },

  async logout(input?: LogoutRequest) {
    const refreshToken = input?.refreshToken ?? getRefreshToken();

    try {
      return refreshToken
        ? await authRepository.logout({ refreshToken })
        : { message: undefined };
    } finally {
      clearAuthSession();
    }
  },
};
