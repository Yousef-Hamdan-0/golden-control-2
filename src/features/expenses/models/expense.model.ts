import { z } from "zod";
import { monthLabel } from "@/lib/format/months";

type JsonRecord = Record<string, unknown>;

export type ExpenseCategory = "fixed" | "variable";
export type ExpenseCategoryFilter = "all" | ExpenseCategory;

export interface ExpenseRecord {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  month: string;
  createdAt?: string;
}

export type ExpenseInput = Omit<ExpenseRecord, "id">;

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  fixed: "ثابت",
  variable: "متغير",
};

export const ExpenseListQuerySchema = z.object({
  type: z.union([z.enum(["fixed", "variable"]), z.literal("all")]),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export const ExpensePayloadSchema = z.object({
  type: z.enum(["fixed", "variable"]),
  name: z.string().trim().min(1),
  amount: z.coerce.number().min(0),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export type ExpenseListQuery = z.infer<typeof ExpenseListQuerySchema>;
export type ExpensePayload = z.infer<typeof ExpensePayloadSchema>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
  }
  return "";
}

function numberValue(...values: unknown[]) {
  for (const value of values) {
    if (value === undefined || value === null || value === "") continue;
    const number = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

function dataValue(payload: unknown) {
  if (!isRecord(payload)) return payload;
  return payload.data ?? payload;
}

function monthKey(month: number, year: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function dateMonthKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return monthKey(date.getUTCMonth() + 1, date.getUTCFullYear());
}

function monthParts(value: string) {
  const [year, month] = value.split("-").map(Number);
  return {
    month: Number.isFinite(month) ? month : new Date().getMonth() + 1,
    year: Number.isFinite(year) ? year : new Date().getFullYear(),
  };
}

export function normalizeExpense(payload: unknown): ExpenseRecord {
  const data = dataValue(payload);
  const raw = isRecord(data) ? data : {};
  const category = stringValue(raw.type, raw.category);
  const parsedCategory =
    category === "variable" || category === "fixed"
      ? category
      : "variable";
  const createdAt = stringValue(raw.createdAt, raw.created_at);
  const month = numberValue(raw.month);
  const year = numberValue(raw.year);
  const recordMonth =
    month && year
      ? monthKey(month, year)
      : dateMonthKey(createdAt) ||
        monthKey(new Date().getMonth() + 1, new Date().getFullYear());

  return {
    id: stringValue(raw.id, raw._id),
    title: stringValue(raw.name, raw.title, "مصروف غير محدد"),
    category: parsedCategory,
    amount: numberValue(raw.amount),
    month: recordMonth,
    createdAt,
  };
}

export function normalizeExpenseListResponse(payload: unknown) {
  const data = dataValue(payload);
  const items = Array.isArray(data) ? data : [];
  return items.map(normalizeExpense);
}

export class ExpensePayloadModel {
  constructor(private readonly input: ExpenseInput) {}

  toJSON(): ExpensePayload {
    const { month, year } = monthParts(this.input.month);

    const payload = {
      type: this.input.category,
      name: this.input.title,
      amount: this.input.amount,
      ...(this.input.category === "variable" ? { month, year } : {}),
    };

    return ExpensePayloadSchema.parse(payload);
  }
}

export function isExpenseMonth(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function formatExpenseMonth(value: string) {
  if (!isExpenseMonth(value)) return value;

  const [year, month] = value.split("-").map(Number);
  return `${monthLabel(month)} ${year}`;
}

export function nextExpenseId(expenses: readonly ExpenseRecord[]) {
  const highestId = expenses.reduce((highest, expense) => {
    const numericId = Number(expense.id.replace(/\D/g, ""));
    return Number.isFinite(numericId) ? Math.max(highest, numericId) : highest;
  }, 0);

  return `EXP-${String(highestId + 1).padStart(4, "0")}`;
}
