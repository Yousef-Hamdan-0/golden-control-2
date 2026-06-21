import { z } from "zod";

export const RefreshTokenRequestSchema = z.object({
  refreshToken: z
    .string({ error: "رمز تحديث الجلسة مطلوب" })
    .trim()
    .min(1, "رمز تحديث الجلسة مطلوب"),
});

export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;

/** Request model sent to POST /api/auth/refresh. */
export class RefreshTokenRequestModel implements RefreshTokenRequest {
  readonly refreshToken: string;

  constructor(input: RefreshTokenRequest) {
    const parsed = RefreshTokenRequestSchema.parse(input);
    this.refreshToken = parsed.refreshToken;
  }

  toJSON(): RefreshTokenRequest {
    return { refreshToken: this.refreshToken };
  }
}

const RefreshTokenPayloadSchema = z
  .object({
    token: z.string().optional(),
    accessToken: z.string().optional(),
    access_token: z.string().optional(),
    refreshToken: z.string().optional(),
    refresh_token: z.string().optional(),
  })
  .passthrough();

export const RefreshTokenApiResponseSchema = RefreshTokenPayloadSchema.extend({
  success: z.boolean().optional(),
  message: z.string().optional(),
  data: RefreshTokenPayloadSchema.optional(),
});

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken?: string;
  message?: string;
}
