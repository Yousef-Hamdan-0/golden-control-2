import { z } from "zod";

type JsonRecord = Record<string, unknown>;

export type PayrollAdjustmentType =
  | "salary"
  | "bonus"
  | "deduction"
  | "overtime"
  | "commission";
export type PayrollAdjustmentFilter = "all" | PayrollAdjustmentType;

export interface PayrollAdjustment {
  id: string;
  userId: string;
  type: PayrollAdjustmentType;
  amount: number;
  note: string;
  date: string;
}

export interface PayrollAdjustmentInput {
  userId: string;
  type: PayrollAdjustmentType;
  amount: number;
  month: number;
  year: number;
  note: string;
}

export const PAYROLL_ADJUSTMENT_LABELS: Record<PayrollAdjustmentType, string> = {
  salary: "راتب",
  bonus: "مكافأة",
  deduction: "خصم",
  overtime: "عمل إضافي",
  commission: "عمولة",
};

export const PayrollRecordListQuerySchema = z.object({
  page: z.coerce.number().int().positive(),
  limit: z.coerce.number().int().positive().max(1000),
  type: z
    .union([
      z.enum(["salary", "bonus", "deduction", "overtime", "commission"]),
      z.literal("all"),
    ])
    .optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  search: z.string().trim().optional(),
});

export const PayrollRecordPayloadSchema = z.object({
  userId: z.preprocess((value) => entityIdValue(value), z.string().trim().min(1)),
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  amount: z.coerce.number().min(0),
  note: z.string().trim(),
  type: z.enum(["salary", "bonus", "deduction", "overtime", "commission"]),
});

export type PayrollRecordListQuery = z.infer<typeof PayrollRecordListQuerySchema>;
export type PayrollRecordPayload = z.infer<typeof PayrollRecordPayloadSchema>;

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

function entityIdValue(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
    if (!isRecord(value)) continue;

    const nestedId = value.id ?? value._id ?? value.userId ?? value.user_id;
    if (typeof nestedId === "string" && nestedId.trim()) return nestedId;
    if (typeof nestedId === "number") return String(nestedId);
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

function payrollType(value: unknown): PayrollAdjustmentType {
  const type = stringValue(value);
  if (
    type === "salary" ||
    type === "bonus" ||
    type === "deduction" ||
    type === "overtime" ||
    type === "commission"
  ) {
    return type;
  }
  return "salary";
}

function monthParts(value: string) {
  const [year, month] = value.split("-").map(Number);
  return {
    year: Number.isFinite(year) ? year : new Date().getFullYear(),
    month: Number.isFinite(month) ? month : new Date().getMonth() + 1,
  };
}

export function normalizePayrollRecord(payload: unknown): PayrollAdjustment {
  const data = dataValue(payload);
  const raw = isRecord(data) ? data : {};
  const user = isRecord(raw.user) ? raw.user : {};
  const recordMonth = numberValue(raw.month);
  const recordYear = numberValue(raw.year);
  const month = recordMonth || new Date().getMonth() + 1;
  const year = recordYear || new Date().getFullYear();
  const createdAt = stringValue(raw.createdAt, raw.created_at);
  const fallbackDate = `${monthKey(month, year)}-01`;

  return {
    id: stringValue(raw.id, raw._id),
    userId: entityIdValue(raw.userId, raw.user_id, raw.user, user.id, user._id),
    type: payrollType(raw.type),
    amount: numberValue(raw.amount),
    note: stringValue(raw.note, raw.notes),
    date: recordMonth && recordYear ? fallbackDate : createdAt.slice(0, 10) || fallbackDate,
  };
}

export interface PayrollRecordListResult {
  items: PayrollAdjustment[];
  total: number;
  page: number;
  pageSize: number;
}

export function normalizePayrollRecordListResponse(
  payload: unknown,
  fallback: PayrollRecordListQuery,
): PayrollRecordListResult {
  const root = isRecord(payload) ? payload : {};
  const data = dataValue(payload);
  const dataRecord = isRecord(data) ? data : {};
  const rawItems =
    (Array.isArray(data) && data) ||
    (Array.isArray(dataRecord.items) && dataRecord.items) ||
    (Array.isArray(dataRecord.records) && dataRecord.records) ||
    (Array.isArray(dataRecord.payrollRecords) && dataRecord.payrollRecords) ||
    (Array.isArray(root.items) && root.items) ||
    [];
  const pagination =
    (isRecord(root.pagination) && root.pagination) ||
    (isRecord(dataRecord.pagination) && dataRecord.pagination) ||
    {};
  const items = rawItems.map(normalizePayrollRecord);

  return {
    items,
    total:
      numberValue(
        pagination.total,
        pagination.totalCount,
        dataRecord.total,
        root.total,
      ) || items.length,
    page: numberValue(pagination.page, pagination.currentPage, dataRecord.page, root.page) || fallback.page,
    pageSize:
      numberValue(
        pagination.limit,
        pagination.pageSize,
        dataRecord.limit,
        root.limit,
      ) || fallback.limit,
  };
}

export class PayrollRecordPayloadModel {
  constructor(
    private readonly input: PayrollAdjustmentInput,
    private readonly payrollMonth: string,
  ) {}

  toJSON(): PayrollRecordPayload {
    const fallback = monthParts(this.payrollMonth);
    const month = this.input.month || fallback.month;
    const year = this.input.year || fallback.year;

    return PayrollRecordPayloadSchema.parse({
      userId: entityIdValue(this.input.userId),
      type: this.input.type,
      amount: this.input.amount,
      note: this.input.note,
      month,
      year,
    });
  }
}

export function isPayrollMonth(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function formatPayrollMonth(value: string) {
  if (!isPayrollMonth(value)) return value;

  return new Intl.DateTimeFormat("ar-SY-u-nu-latn", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}-01T12:00:00Z`));
}

export function formatPayrollDate(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ar-SY-u-nu-latn", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function nextPayrollAdjustmentId(adjustments: readonly PayrollAdjustment[]) {
  const highestId = adjustments.reduce((highest, adjustment) => {
    const numericId = Number(adjustment.id.replace(/\D/g, ""));
    return Number.isFinite(numericId) ? Math.max(highest, numericId) : highest;
  }, 0);

  return `PAY-${String(highestId + 1).padStart(4, "0")}`;
}

export function adjustmentDateForMonth(month: string) {
  const today = new Date();
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  const day = Math.min(today.getDate(), lastDay);

  return `${month}-${String(day).padStart(2, "0")}`;
}
