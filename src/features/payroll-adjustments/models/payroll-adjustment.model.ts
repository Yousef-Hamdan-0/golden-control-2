export type PayrollAdjustmentType = "advance" | "deduction" | "increase";
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
  note: string;
}

export const PAYROLL_ADJUSTMENT_LABELS: Record<PayrollAdjustmentType, string> = {
  advance: "سلفة",
  deduction: "خصم",
  increase: "زيادة",
};

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
