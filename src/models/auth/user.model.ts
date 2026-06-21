import { z } from "zod";

/** Roles (PRD). Values are stable codes; labels are Arabic display. */
export const Role = {
  Admin: "admin",
  Manager: "manager",
  Employee: "employee",
  Technician: "technician",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const ROLE_LABELS_AR: Record<Role, string> = {
  admin: "مدير النظام",
  manager: "مدير المركز",
  employee: "موظف خدمة العملاء",
  technician: "فني",
};

/** Availability status. */
export const UserStatus = {
  Available: "available",
  Unavailable: "unavailable",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const STATUS_LABELS_AR: Record<UserStatus, string> = {
  available: "متاح",
  unavailable: "غير متاح",
};

export const RoleSchema = z.enum(["admin", "manager", "employee", "technician"]);
export const UserStatusSchema = z.enum(["available", "unavailable"]);

/** The full user entity as returned by the server. */
export const UserSchema = z.object({
  /** Internal database identifier used by GET/PATCH /api/users/{id}. */
  id: z.string(),
  /** Human-readable staff identifier displayed in the users table. */
  userNumber: z.string().optional(),
  fullName: z.string(),
  email: z.string().email(),
  phone: z.string(),
  jobTitle: z.string(),
  role: RoleSchema,
  status: UserStatusSchema,
  salary: z.number().nonnegative(), // Syrian Lira (ل.س)
  /** Resolved profile photo URL used by the UI. */
  imageUrl: z.string().max(4_000_000).optional(),
  /** Optional personal identity document image. */
  identityDocumentUrl: z.string().max(4_000_000).optional(),
  profileImagePath: z.string().optional(),
  documentImagePath: z.string().optional(),
  /** Used by legacy technician/payroll screens; not part of the Users API request. */
  discount: z.number().nonnegative().optional(),
});
export type User = z.infer<typeof UserSchema>;

/** Counts used by the KPI cards under the users table. */
export const UserCountsSchema = z.object({
  certifiedTechnicians: z.number(),
  employees: z.number(),
  total: z.number(),
});
export type UserCounts = z.infer<typeof UserCountsSchema>;
