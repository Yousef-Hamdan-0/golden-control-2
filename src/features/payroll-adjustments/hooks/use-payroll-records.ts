"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/query-keys";
import { payrollService } from "@/services/payroll.service";
import type {
  PayrollRecordCreateParams,
  PayrollRecordListParams,
} from "@/repositories/payroll.repository";

export function usePayrollRecordsQuery(params: PayrollRecordListParams = {}) {
  return useQuery({
    queryKey: queryKeys.payroll.list(params),
    queryFn: () => payrollService.list(params),
  });
}

export function usePayrollRecordMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.payroll.all });

  const create = useMutation({
    mutationFn: (params: PayrollRecordCreateParams) => payrollService.create(params),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => payrollService.delete(id),
    onSuccess: invalidate,
  });

  return { create, remove };
}
