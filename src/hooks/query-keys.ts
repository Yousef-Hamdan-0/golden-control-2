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
import type {
  ExpenseListParams,
  FinancialSummaryParams,
} from "@/repositories/finance.repository";
import type { PayrollRecordListParams } from "@/repositories/payroll.repository";

/**
 * Single source for every cache key. Precise keys = precise invalidation.
 * Role + status live in the users.list key so changing a filter refetches
 * exactly that slice and caches each combination separately.
 */
export const queryKeys = {
  dashboard: {
    all: ["dashboard"] as const,
    stats: () => ["dashboard", "stats"] as const,
    technicianPerformance: () =>
      ["dashboard", "technician-performance"] as const,
  },
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
  finance: {
    all: ["finance"] as const,
    expenses: {
      all: ["finance", "expenses"] as const,
      list: (params: ExpenseListParams) => ["finance", "expenses", "list", params] as const,
      detail: (id: string) => ["finance", "expenses", "detail", id] as const,
    },
    summary: (params: FinancialSummaryParams) => ["finance", "summary", params] as const,
  },
  payroll: {
    all: ["payroll-records"] as const,
    list: (params: PayrollRecordListParams) => ["payroll-records", "list", params] as const,
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
