import {
  financeRepository,
  type DailyFinancialSummary,
  type ExpenseListParams,
  type FinancialSummary,
  type FinancialSummaryParams,
} from "@/repositories/finance.repository";
import type { AuthenticatedBlobResponse } from "@/helpers/authenticated-api.helper";
import type {
  ExpenseInput,
  ExpenseRecord,
} from "@/features/expenses/models/expense.model";

export type {
  DailyFinancialSummary,
  ExpenseListParams,
  FinancialSummary,
  FinancialSummaryParams,
};

export const financeService = {
  listExpenses(params: ExpenseListParams): Promise<ExpenseRecord[]> {
    return financeRepository.listExpenses(params);
  },

  getExpenseById(id: string): Promise<ExpenseRecord> {
    return financeRepository.getExpenseById(id);
  },

  createExpense(input: ExpenseInput): Promise<ExpenseRecord> {
    return financeRepository.createExpense(input);
  },

  updateExpense(id: string, input: ExpenseInput): Promise<ExpenseRecord> {
    return financeRepository.updateExpense(id, input);
  },

  deleteExpense(id: string): Promise<void> {
    return financeRepository.deleteExpense(id);
  },

  getSummary(params: FinancialSummaryParams): Promise<FinancialSummary> {
    return financeRepository.getSummary(params);
  },

  getDailySummary(date: string): Promise<DailyFinancialSummary> {
    return financeRepository.getDailySummary(date);
  },

  downloadReportPdf(params: FinancialSummaryParams): Promise<AuthenticatedBlobResponse> {
    return financeRepository.downloadReportPdf(params);
  },
};
