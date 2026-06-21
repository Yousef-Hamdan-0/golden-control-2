import { API_ENDPOINTS } from "@/config/api-endpoints";
import { normalizeLoginResponse } from "@/helpers/auth-response.helper";
import {
  normalizeLogoutResponse,
  normalizeRefreshTokenResponse,
} from "@/helpers/auth-response.helper";
import { requestApi } from "@/helpers/api.helper";
import {
  LoginRequestSchema,
  type LoginRequest,
  type LoginResult,
} from "@/models/auth/login.model";
import {
  RefreshTokenRequestModel,
  type RefreshTokenRequest,
  type RefreshTokenResult,
} from "@/models/auth/refresh-token.model";
import {
  LogoutRequestModel,
  type LogoutRequest,
  type LogoutResult,
} from "@/models/auth/logout.model";

const jsonRequestHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json",
} as const;

export const authRepository = {
  async login(input: LoginRequest): Promise<LoginResult> {
    const requestBody = LoginRequestSchema.parse(input);
    const response = await requestApi(API_ENDPOINTS.auth.login, {
      method: "POST",
      headers: jsonRequestHeaders,
      body: JSON.stringify(requestBody),
    });

    return normalizeLoginResponse(response);
  },

  async refresh(input: RefreshTokenRequest): Promise<RefreshTokenResult> {
    const requestBody = new RefreshTokenRequestModel(input).toJSON();
    const response = await requestApi(API_ENDPOINTS.auth.refresh, {
      method: "POST",
      headers: jsonRequestHeaders,
      body: JSON.stringify(requestBody),
    });

    return normalizeRefreshTokenResponse(response);
  },

  async logout(input: LogoutRequest): Promise<LogoutResult> {
    const requestBody = new LogoutRequestModel(input).toJSON();
    const response = await requestApi(API_ENDPOINTS.auth.logout, {
      method: "POST",
      headers: jsonRequestHeaders,
      body: JSON.stringify(requestBody),
    });

    return normalizeLogoutResponse(response);
  },
};
