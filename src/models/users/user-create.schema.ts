import { z } from "zod";
import { RoleSchema } from "@/models/auth/user.model";

/**
 * Password policy shared by create and update so the frontend never diverges
 * from the backend rule. The backend rejects passwords that are not "strong"
 * enough (lowercase + uppercase + number + symbol), so we surface the same
 * requirements here with clear Arabic messages instead of letting the request
 * fail silently on the server.
 */
export const UserPasswordSchema = z
  .string()
  .trim()
  .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
  .regex(/[a-z]/, "كلمة المرور يجب أن تحتوي على حرف إنجليزي صغير واحد على الأقل (a-z)")
  .regex(/[A-Z]/, "كلمة المرور يجب أن تحتوي على حرف إنجليزي كبير واحد على الأقل (A-Z)")
  .regex(/[0-9]/, "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل (0-9)")
  .regex(/[^A-Za-z0-9]/, "كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل (مثل ! @ # $)");

/** Form input mapped to POST /api/users multipart fields. */
export const UserCreateSchema = z.object({
  fullName: z.string().trim().min(2, "الاسم مطلوب"),
  email: z.string().trim().email("بريد إلكتروني غير صالح"),
  phone: z
    .string()
    .trim()
    .min(7, "رقم هاتف غير صالح")
    .regex(/^[+0-9\s-]+$/, "رقم هاتف غير صالح"),
  role: RoleSchema,
  jobTitle: z.string().trim().optional().or(z.literal("")),
  salary: z.coerce
    .number()
    .nonnegative("الراتب يجب أن يكون رقماً موجباً")
    .max(9_999_999_999.99, "الراتب يجب ألا يتجاوز 9999999999.99"),
  imageUrl: z.string().max(4_000_000, "حجم الصورة كبير جدًا").optional().or(z.literal("")),
  identityDocumentUrl: z
    .string()
    .max(4_000_000, "حجم صورة الوثيقة كبير جدًا")
    .optional()
    .or(z.literal("")),
  password: UserPasswordSchema,
});

export type UserCreateInput = z.infer<typeof UserCreateSchema>;
