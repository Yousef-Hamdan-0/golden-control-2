import type { ExpenseRecord } from "@/features/expenses/models/expense.model";

export const DEFAULT_EXPENSE_MONTH = "2026-06";

export const INITIAL_EXPENSES: readonly ExpenseRecord[] = [
  {
    id: "EXP-1009",
    title: "وقود سيارات الصيانة",
    category: "variable",
    amount: 740_000,
    month: "2026-06",
  },
  {
    id: "EXP-1008",
    title: "رواتب الموظفين",
    category: "fixed",
    amount: 9_000_000,
    month: "2026-06",
  },
  {
    id: "EXP-1007",
    title: "قطع وأدوات تشغيلية",
    category: "variable",
    amount: 1_250_000,
    month: "2026-06",
  },
  {
    id: "EXP-1006",
    title: "اشتراك الإنترنت",
    category: "fixed",
    amount: 350_000,
    month: "2026-06",
  },
  {
    id: "EXP-1005",
    title: "صيانة سيارات المركز",
    category: "variable",
    amount: 980_000,
    month: "2026-06",
  },
  {
    id: "EXP-1004",
    title: "إيجار المركز",
    category: "fixed",
    amount: 4_200_000,
    month: "2026-06",
  },
  {
    id: "EXP-1003",
    title: "مواد تنظيف",
    category: "variable",
    amount: 225_000,
    month: "2026-06",
  },
  {
    id: "EXP-1002",
    title: "إيجار المركز",
    category: "fixed",
    amount: 4_200_000,
    month: "2026-05",
  },
  {
    id: "EXP-1001",
    title: "كهرباء ومياه",
    category: "variable",
    amount: 510_000,
    month: "2026-05",
  },
];
