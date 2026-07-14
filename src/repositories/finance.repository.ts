import { API_ENDPOINTS } from "@/config/api-endpoints";
import {
  requestAuthenticatedApi,
  requestAuthenticatedBlob,
  type AuthenticatedBlobResponse,
} from "@/helpers/authenticated-api.helper";
import {
  ExpenseListQuerySchema,
  ExpensePayloadModel,
  normalizeExpense,
  normalizeExpenseListResponse,
  type ExpenseCategoryFilter,
  type ExpenseInput,
  type ExpenseRecord,
} from "@/features/expenses/models/expense.model";

export interface ExpenseListParams {
  type?: ExpenseCategoryFilter;
  month?: number;
  year?: number;
}

/** GET /api/reports/financial — real backend contract: a single year plus up
 * to 3 month numbers within that year (not an arbitrary date range). */
export interface FinancialSummaryParams {
  year: number;
  months: number[];
}

export interface FinancialSummary {
  totalRevenues: number;
  fixedCosts: number;
  variableCosts: number;
  partsCosts: number;
  netProfit: number;
  periodStart: string;
  periodEnd: string;
}

/** GET /api/finance/summary — sales/profit summary for one specific date. */
export interface DailyFinancialSummary {
  date: string;
  totalSales: number;
  totalPaid: number;
  totalRemaining: number;
  totalPartsCost: number;
  netProfit: number;
  invoiceCount: number;
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function dataRecord(payload: unknown): JsonRecord {
  if (!isRecord(payload)) return {};
  return isRecord(payload.data) ? payload.data : payload;
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

function normalizeFinancialSummary(payload: unknown): FinancialSummary {
  const data = dataRecord(payload);
  // The real response nests the totals under `data.summary` with a `...Syp`
  // suffix (e.g. `totalRevenuesSyp`); the older flat/snake_case field names
  // are kept as fallbacks in case the backend shape changes again.
  const summary = isRecord(data.summary) ? data.summary : data;
  return {
    totalRevenues: numberValue(summary.totalRevenuesSyp, summary.totalRevenues, summary.total_revenues),
    fixedCosts: numberValue(summary.fixedCostsSyp, summary.fixedCosts, summary.fixed_costs),
    variableCosts: numberValue(summary.variableExpensesSum, summary.variableCosts, summary.variable_costs),
    partsCosts: numberValue(summary.partsCostsSyp, summary.partsCosts, summary.parts_costs),
    netProfit: numberValue(summary.netProfitSyp, summary.netProfit, summary.net_profit),
    periodStart: stringValue(summary.periodStart, summary.period_start),
    periodEnd: stringValue(summary.periodEnd, summary.period_end),
  };
}

function normalizeDailyFinancialSummary(payload: unknown): DailyFinancialSummary {
  const data = dataRecord(payload);
  return {
    date: stringValue(data.date),
    totalSales: numberValue(data.totalSales, data.total_sales),
    totalPaid: numberValue(data.totalPaid, data.total_paid),
    totalRemaining: numberValue(data.totalRemaining, data.total_remaining),
    totalPartsCost: numberValue(data.totalPartsCost, data.total_parts_cost),
    netProfit: numberValue(data.netProfit, data.net_profit),
    invoiceCount: numberValue(data.invoiceCount, data.invoice_count),
  };
}

function expenseListQuery(params: ExpenseListParams) {
  return ExpenseListQuerySchema.parse({
    type: params.type ?? "all",
    month: params.month,
    year: params.year,
  });
}

function yearMonthsQuery(params: FinancialSummaryParams) {
  return {
    year: params.year,
    // Backend caps the period at 3 months; de-dupe and drop invalid values.
    months: [...new Set(params.months)]
      .filter((month) => Number.isInteger(month) && month >= 1 && month <= 12)
      .slice(0, 3),
  };
}

function yearMonthsSearchParams(params: FinancialSummaryParams) {
  const query = yearMonthsQuery(params);
  const searchParams = new URLSearchParams({ year: String(query.year) });
  for (const month of query.months) searchParams.append("months", String(month));
  return searchParams;
}

export const financeRepository = {
  async listExpenses(params: ExpenseListParams): Promise<ExpenseRecord[]> {
    const query = expenseListQuery(params);
    const searchParams = new URLSearchParams();
    // Only constrain by month/year when a date filter is actually set,
    // otherwise the API returns all matching expenses.
    if (query.month) searchParams.set("month", String(query.month));
    if (query.year) searchParams.set("year", String(query.year));
    if (query.type !== "all") searchParams.set("type", query.type);

    const payload = await requestAuthenticatedApi(
      `${API_ENDPOINTS.finance.expenses}?${searchParams}`,
      { method: "GET" },
    );

    return normalizeExpenseListResponse(payload);
  },

  async getExpenseById(id: string): Promise<ExpenseRecord> {
    const payload = await requestAuthenticatedApi(API_ENDPOINTS.finance.expenseById(id), {
      method: "GET",
    });
    return normalizeExpense(payload);
  },

  async createExpense(input: ExpenseInput): Promise<ExpenseRecord> {
    const body = new ExpensePayloadModel(input).toJSON();
    const payload = await requestAuthenticatedApi(API_ENDPOINTS.finance.expenses, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return normalizeExpense(payload);
  },

  async updateExpense(id: string, input: ExpenseInput): Promise<ExpenseRecord> {
    const body = new ExpensePayloadModel(input).toJSON();
    const payload = await requestAuthenticatedApi(API_ENDPOINTS.finance.expenseById(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return normalizeExpense(payload);
  },

  async deleteExpense(id: string): Promise<void> {
    await requestAuthenticatedApi(API_ENDPOINTS.finance.expenseById(id), {
      method: "DELETE",
    });
  },

  async getDailySummary(date: string): Promise<DailyFinancialSummary> {
    const searchParams = new URLSearchParams({ date: date.trim() });
    const payload = await requestAuthenticatedApi(
      `${API_ENDPOINTS.finance.summary}?${searchParams}`,
      { method: "GET" },
    );
    return normalizeDailyFinancialSummary(payload);
  },

  async getSummary(params: FinancialSummaryParams): Promise<FinancialSummary> {
    const searchParams = yearMonthsSearchParams(params);
    // The backend moved the range summary to the financial report endpoint;
    // /api/finance/summary now only serves the single-day summary (?date=).
    const payload = await requestAuthenticatedApi(
      `${API_ENDPOINTS.reports.financialData}?${searchParams}`,
      { method: "GET" },
    );
    return normalizeFinancialSummary(payload);
  },

  async downloadReportPdf(params: FinancialSummaryParams): Promise<AuthenticatedBlobResponse> {
    const searchParams = yearMonthsSearchParams(params);
    return requestAuthenticatedBlob(`${API_ENDPOINTS.finance.reportPdf}?${searchParams}`, {
      method: "GET",
      headers: { Accept: "application/pdf, application/json" },
    });
  },
};
