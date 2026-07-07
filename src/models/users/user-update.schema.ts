import { z } from "zod";
import { RoleSchema, UserStatusSchema } from "@/models/auth/user.model";
import { UserPasswordSchema } from "@/models/users/user-create.schema";

/** Form input mapped to PATCH /api/users/{id} multipart fields. */
export const UserUpdateSchema = z.object({
  fullName: z.string().trim().min(2, "الاسم مطلوب"),
  email: z.string().trim().email("بريد إلكتروني غير صالح"),
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
  profileImagePath: z.string().optional().or(z.literal("")),
  documentImagePath: z.string().optional().or(z.literal("")),
  role: RoleSchema,
  status: UserStatusSchema,
  password: UserPasswordSchema.optional().or(z.literal("")),
});

export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;

export const UserUpdatePatchSchema = UserUpdateSchema.partial();
export type UserUpdatePatchInput = z.infer<typeof UserUpdatePatchSchema>;
