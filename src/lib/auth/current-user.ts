import type { User } from "@/models/auth/user.model";

/**
 * MOCK current session user. Replace with NextAuth `useSession()` /
 * `auth.store` hydration when auth is wired in.
 */
export const CURRENT_USER: Pick<User, "fullName" | "role" | "jobTitle"> = {
  fullName: "أحمد العتيبي",
  jobTitle: "مدير النظام",
  role: "admin",
};
