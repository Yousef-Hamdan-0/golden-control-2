import { z } from "zod";

export const LogoutRequestSchema = z.object({
  refreshToken: z
    .string({ error: "رمز تحديث الجلسة مطلوب" })
    .trim()
    .min(1, "رمز تحديث الجلسة مطلوب"),
});

export type LogoutRequest = z.infer<typeof LogoutRequestSchema>;

/** Request model sent to POST /api/auth/logout. */
export class LogoutRequestModel implements LogoutRequest {
  readonly refreshToken: string;

  constructor(input: LogoutRequest) {
    const parsed = LogoutRequestSchema.parse(input);
    this.refreshToken = parsed.refreshToken;
  }

  toJSON(): LogoutRequest {
    return { refreshToken: this.refreshToken };
  }
}

export const LogoutApiResponseSchema = z
  .object({
    success: z.boolean().optional(),
    message: z.string().optional(),
    data: z
      .object({
        success: z.boolean().optional(),
        message: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export interface LogoutResult {
  message?: string;
}
