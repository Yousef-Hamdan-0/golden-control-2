import type { UserListParams } from "@/repositories/user.repository";
import type { CustomerListParams } from "@/repositories/customer.repository";
import type { RequestListParams } from "@/repositories/request.repository";
import type {
  InvoiceListParams,
  PaymentListParams,
} from "@/repositories/invoice.repository";
import type {
  InventoryDailyListParams,
  InventoryPartListParams,
} from "@/repositories/inventory.repository";

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
    listAll: (params: Omit<UserListParams, "page" | "pageSize">) =>
      ["users", "list-all", params] as const,
    counts: () => ["users", "counts"] as const,
    detail: (id: string) => ["users", "detail", id] as const,
  },
  customers: {
    all: ["customers"] as const,
    list: (params: CustomerListParams) => ["customers", "list", params] as const,
    detail: (id: string) => ["customers", "detail", id] as const,
  },
  requests: {
    all: ["requests"] as const,
    list: (params: RequestListParams) => ["requests", "list", params] as const,
    detail: (id: string) => ["requests", "detail", id] as const,
    statusHistory: (id: string) => ["requests", "status-history", id] as const,
  },
  invoices: {
    all: ["invoices"] as const,
    list: (params: InvoiceListParams) => ["invoices", "list", params] as const,
    listAll: (params: Omit<InvoiceListParams, "page">) =>
      ["invoices", "list-all", params] as const,
    detail: (id: string) => ["invoices", "detail", id] as const,
    payments: (invoiceId: string, params: PaymentListParams) =>
      ["invoices", "payments", invoiceId, params] as const,
  },
  settings: {
    all: ["settings"] as const,
    detail: () => ["settings", "detail"] as const,
  },
  technicians: {
    all: ["technicians"] as const,
    inventory: (page: number) => ["technicians", "inventory", page] as const,
  },
  inventory: {
    all: ["inventory"] as const,
    daily: (params: InventoryDailyListParams) => ["inventory", "daily", params] as const,
    dailyAll: () => ["inventory", "daily", "all"] as const,
    parts: (params: InventoryPartListParams) => ["inventory", "parts", params] as const,
    partsAll: () => ["inventory", "parts", "all"] as const,
    movements: () => ["inventory", "movements"] as const,
  },
};
