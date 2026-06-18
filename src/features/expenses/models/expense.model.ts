export type ExpenseCategory = "fixed" | "variable";
export type ExpenseCategoryFilter = "all" | ExpenseCategory;

export interface ExpenseRecord {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  month: string;
}

export type ExpenseInput = Omit<ExpenseRecord, "id">;

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  fixed: "ثابت",
  variable: "متغير",
};

export function isExpenseMonth(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function formatExpenseMonth(value: string) {
  if (!isExpenseMonth(value)) return value;

  return new Intl.DateTimeFormat("ar-SY-u-nu-latn", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}-01T12:00:00Z`));
}

export function nextExpenseId(expenses: readonly ExpenseRecord[]) {
  const highestId = expenses.reduce((highest, expense) => {
    const numericId = Number(expense.id.replace(/\D/g, ""));
    return Number.isFinite(numericId) ? Math.max(highest, numericId) : highest;
  }, 0);

  return `EXP-${String(highestId + 1).padStart(4, "0")}`;
}
