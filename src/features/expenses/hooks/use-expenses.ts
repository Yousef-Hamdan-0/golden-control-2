"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/query-keys";
import { financeService } from "@/services/finance.service";
import type { ExpenseInput } from "@/features/expenses/models/expense.model";
import type {
  ExpenseListParams,
  FinancialSummaryParams,
} from "@/repositories/finance.repository";

export function useExpensesQuery(params: ExpenseListParams) {
  return useQuery({
    queryKey: queryKeys.finance.expenses.list(params),
    queryFn: () => financeService.listExpenses(params),
  });
}

export function useExpenseQuery(id: string | null) {
  return useQuery({
    queryKey: queryKeys.finance.expenses.detail(id ?? ""),
    queryFn: () => financeService.getExpenseById(id ?? ""),
    enabled: Boolean(id),
  });
}

export function useFinanceSummaryQuery(params: FinancialSummaryParams) {
  return useQuery({
    queryKey: queryKeys.finance.summary(params),
    queryFn: () => financeService.getSummary(params),
    enabled: Boolean(params.startDate && params.endDate),
  });
}

export function useExpenseMutations() {
  const qc = useQueryClient();
  const invalidateExpenses = () =>
    qc.invalidateQueries({ queryKey: queryKeys.finance.expenses.all });
  const invalidateFinance = () => qc.invalidateQueries({ queryKey: queryKeys.finance.all });

  const create = useMutation({
    mutationFn: (input: ExpenseInput) => financeService.createExpense(input),
    onSuccess: async () => {
      await Promise.all([invalidateExpenses(), invalidateFinance()]);
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ExpenseInput }) =>
      financeService.updateExpense(id, input),
    onSuccess: async (_data, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.finance.expenses.detail(vars.id) }),
        invalidateExpenses(),
        invalidateFinance(),
      ]);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => financeService.deleteExpense(id),
    onSuccess: async (_data, id) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.finance.expenses.detail(id) }),
        invalidateExpenses(),
        invalidateFinance(),
      ]);
    },
  });

  return { create, update, remove };
}
