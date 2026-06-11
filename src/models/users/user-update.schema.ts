import { z } from "zod";
import { RoleSchema, UserStatusSchema } from "@/models/auth/user.model";

/**
 * Validated input for editing a user (screen 12c). Admin-only.
 * `password` is optional: empty = keep current; filled = set new password.
 */
export const UserUpdateSchema = z.object({
  fullName: z.string().min(2, "الاسم مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  phone: z.string().min(7, "رقم هاتف غير صالح"),
  jobTitle: z.string().min(2, "المسمى الوظيفي مطلوب"),
  salary: z.coerce.number().nonnegative("الراتب يجب أن يكون رقماً موجباً"),
  role: RoleSchema,
  status: UserStatusSchema,
  password: z
    .string()
    .min(8, "كلمة المرور 8 أحرف على الأقل")
    .optional()
    .or(z.literal("")),
});

export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;
