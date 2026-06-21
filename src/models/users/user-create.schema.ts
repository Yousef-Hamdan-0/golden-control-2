import { z } from "zod";
import { RoleSchema } from "@/models/auth/user.model";

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
  salary: z.coerce.number().nonnegative("الراتب يجب أن يكون رقماً موجباً"),
  imageUrl: z.string().max(4_000_000, "حجم الصورة كبير جدًا").optional().or(z.literal("")),
  identityDocumentUrl: z
    .string()
    .max(4_000_000, "حجم صورة الوثيقة كبير جدًا")
    .optional()
    .or(z.literal("")),
  password: z.string().min(8, "كلمة المرور 8 أحرف على الأقل"),
});

export type UserCreateInput = z.infer<typeof UserCreateSchema>;
