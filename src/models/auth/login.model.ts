import { z } from "zod";

/** Exact request contract expected by the login API. */
export const LoginRequestSchema = z.object({
  email: z.string().trim().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
  tokenDevice: z.string().min(1, "رمز الجهاز غير متوفر"),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthenticatedUserSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    fullName: z.string().optional(),
    name: z.string().optional(),
    email: z.string().email().optional(),
    role: z.string().optional(),
  })
  .passthrough();

const LoginPayloadSchema = z
  .object({
    token: z.string().optional(),
    accessToken: z.string().optional(),
    access_token: z.string().optional(),
    refreshToken: z.string().optional(),
    refresh_token: z.string().optional(),
    user: AuthenticatedUserSchema.optional(),
  })
  .passthrough();

/**
 * Temporary flexible response model until the backend response JSON is finalized.
 * It supports tokens returned at the root or inside `data`.
 */
export const LoginApiResponseSchema = LoginPayloadSchema.extend({
  success: z.boolean().optional(),
  message: z.string().optional(),
  data: LoginPayloadSchema.optional(),
});

export type LoginApiResponse = z.infer<typeof LoginApiResponseSchema>;
export type AuthenticatedUser = z.infer<typeof AuthenticatedUserSchema>;

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user?: AuthenticatedUser;
  message?: string;
}
