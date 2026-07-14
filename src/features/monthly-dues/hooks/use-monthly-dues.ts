"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/query-keys";
import { monthlyDuesService } from "@/services/monthly-dues.service";
import type { MonthlyDuesParams } from "@/repositories/monthly-dues.repository";

export function useMonthlyDuesQuery(params: MonthlyDuesParams | null) {
  return useQuery({
    queryKey: queryKeys.finance.monthlyDues.list(params ?? { year: 0, month: 0 }),
    queryFn: () => monthlyDuesService.list(params as MonthlyDuesParams),
    enabled: Boolean(params),
  });
}

export function useMonthlyDuesArrestMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => monthlyDuesService.arrest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.finance.monthlyDues.all }),
  });
}
