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
  id: z.string(), // e.g. "#USR-841"
  fullName: z.string(),
  email: z.string().email(),
  phone: z.string(),
  jobTitle: z.string(),
  role: RoleSchema,
  status: UserStatusSchema,
  salary: z.number().nonnegative(), // Syrian Lira (ل.س)
  /** Technician-only discount (خصم), per PRD. */
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
