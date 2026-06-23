import type { UserListParams } from "@/repositories/user.repository";
import type { CustomerListParams } from "@/repositories/customer.repository";

/**
 * Single source for every cache key. Precise keys = precise invalidation.
 * Role + status live in the users.list key so changing a filter refetches
 * exactly that slice and caches each combination separately.
 */
export const queryKeys = {
  users: {
    all: ["users"] as const,
    me: () => ["users", "me"] as const,
    list: (params: UserListParams) => ["users", "list", params] as const,
    counts: () => ["users", "counts"] as const,
    detail: (id: string) => ["users", "detail", id] as const,
  },
  customers: {
    all: ["customers"] as const,
    list: (params: CustomerListParams) => ["customers", "list", params] as const,
    detail: (id: string) => ["customers", "detail", id] as const,
  },
  settings: {
    all: ["settings"] as const,
    detail: () => ["settings", "detail"] as const,
  },
  technicians: {
    all: ["technicians"] as const,
    inventory: (page: number) => ["technicians", "inventory", page] as const,
  },
};
