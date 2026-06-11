import { z } from "zod";
import { RoleSchema } from "@/models/auth/user.model";

/** Validated input for creating a user (screen 12a). All fields required. */
export const UserCreateSchema = z
  .object({
    fullName: z.string().min(2, "الاسم مطلوب"),
    email: z.string().email("بريد إلكتروني غير صالح"),
    phone: z
      .string()
      .min(7, "رقم هاتف غير صالح")
      .regex(/^[+0-9\s-]+$/, "رقم هاتف غير صالح"),
    role: RoleSchema,
    jobTitle: z.string().min(2, "المسمى الوظيفي مطلوب"),
    salary: z.coerce.number().nonnegative("الراتب يجب أن يكون رقماً موجباً"),
    password: z.string().min(8, "كلمة المرور 8 أحرف على الأقل"),
    /** Technician-only. */
    discount: z.coerce.number().nonnegative().optional(),
  })
  .refine((v) => v.role !== "technician" || v.discount !== undefined, {
    message: "الخصم مطلوب للفني",
    path: ["discount"],
  });

export type UserCreateInput = z.infer<typeof UserCreateSchema>;
