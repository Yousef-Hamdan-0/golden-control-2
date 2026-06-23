"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/query-keys";
import { customerService } from "@/services/customer.service";
import type {
  CustomerInput,
  CustomerPatchInput,
} from "@/models/customers/customer.model";
import type { CustomerListParams } from "@/repositories/customer.repository";

export function useCustomersQuery(params: CustomerListParams) {
  return useQuery({
    queryKey: queryKeys.customers.list(params),
    queryFn: () => customerService.list(params),
  });
}

export function useCustomerQuery(id: string | null) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id ?? ""),
    queryFn: () => customerService.getById(id ?? ""),
    enabled: Boolean(id),
  });
}

export function useCustomerMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.customers.all });

  const create = useMutation({
    mutationFn: (input: CustomerInput) => customerService.create(input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CustomerPatchInput }) =>
      customerService.update(id, input),
    onSuccess: async (_data, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.customers.detail(vars.id) }),
        invalidate(),
      ]);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => customerService.delete(id),
    onSuccess: async (_data, id) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.customers.detail(id) }),
        invalidate(),
      ]);
    },
  });

  return { create, update, remove };
}
