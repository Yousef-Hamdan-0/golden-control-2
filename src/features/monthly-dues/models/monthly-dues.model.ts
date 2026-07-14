import { mediaUrl } from "@/models/users/user-api.model";
import {
  normalizePayrollRecord,
  type PayrollAdjustment,
  type PayrollAdjustmentType,
} from "@/features/payroll-adjustments/models/payroll-adjustment.model";

type JsonRecord = Record<string, unknown>;

/**
 * Settlement types that increase what an employee is owed. Every other type
 * (deduction, and "salary" which represents an advance already paid out)
 * reduces the monthly total — standard net-pay accounting.
 */
const POSITIVE_ADJUSTMENT_TYPES: readonly PayrollAdjustmentType[] = [
  "bonus",
  "overtime",
  "commission",
];

export function isPositiveAdjustment(type: PayrollAdjustmentType): boolean {
  return POSITIVE_ADJUSTMENT_TYPES.includes(type);
}

export interface MonthlyDueUser {
  userId: string;
  userNumber: string;
  profileImagePath?: string;
  imageUrl?: string;
  fullName: string;
  jobTitle: string;
  roleName: string;
  salary: number;
  payrolls: PayrollAdjustment[];
  monthlyDue: number;
  monthlyDuesId: string;
  isArrested: boolean;
  arrestedDate: string | null;
}

export interface MonthlyDuesResult {
  year: number;
  month: number;
  users: MonthlyDueUser[];
}

export interface MonthlyDuesArrestResult {
  id: string;
  amount: number;
  isArrested: boolean;
  userId: string;
  year: number;
  month: number;
  arrestedDate: string | null;
  createdAt: string;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function numberValue(...values: unknown[]) {
  for (const value of values) {
    if (value === undefined || value === null || value === "") continue;
    const number = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

function stringValue(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
  }
  return "";
}

function nullableStringValue(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string") return value;
  }
  return null;
}

function dataValue(payload: unknown) {
  if (!isRecord(payload)) return payload;
  return payload.data ?? payload;
}

function normalizeMonthlyDueUser(payload: unknown): MonthlyDueUser {
  const raw = isRecord(payload) ? payload : {};
  const profileImagePath = stringValue(raw.profileImagePath) || undefined;

  return {
    userId: stringValue(raw.userId, raw.id),
    userNumber: stringValue(raw.userNumber),
    profileImagePath,
    imageUrl: mediaUrl(profileImagePath),
    fullName: stringValue(raw.fullName),
    jobTitle: stringValue(raw.jobTitle),
    roleName: stringValue(raw.roleName),
    salary: numberValue(raw.salary),
    payrolls: Array.isArray(raw.payrolls) ? raw.payrolls.map(normalizePayrollRecord) : [],
    monthlyDue: numberValue(raw.monthlyDue),
    monthlyDuesId: stringValue(raw.monthlyDuesId),
    isArrested: Boolean(raw.isArrested),
    arrestedDate: nullableStringValue(raw.arrestedDate),
  };
}

export function normalizeMonthlyDuesResponse(payload: unknown): MonthlyDuesResult {
  const data = dataValue(payload);
  const record = isRecord(data) ? data : {};

  return {
    year: numberValue(record.year),
    month: numberValue(record.month),
    users: Array.isArray(record.users) ? record.users.map(normalizeMonthlyDueUser) : [],
  };
}

export function normalizeMonthlyDuesArrestResponse(payload: unknown): MonthlyDuesArrestResult {
  const data = dataValue(payload);
  const raw = isRecord(data) ? data : {};

  return {
    id: stringValue(raw.id),
    amount: numberValue(raw.amount),
    isArrested: Boolean(raw.isArrested),
    userId: stringValue(raw.userId),
    year: numberValue(raw.year),
    month: numberValue(raw.month),
    arrestedDate: nullableStringValue(raw.arrestedDate),
    createdAt: stringValue(raw.createdAt),
  };
}

export function sumMonthlyDues(users: readonly MonthlyDueUser[]): number {
  return users.reduce((sum, user) => sum + user.monthlyDue, 0);
}
